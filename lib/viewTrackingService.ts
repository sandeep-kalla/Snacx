import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

interface MemeView {
  id: string;
  memeId: string;
  userId: string;
  timestamp: number;
  sessionId: string;
  userAgent?: string;
  ipHash?: string;
}

interface ViewStats {
  memeId: string;
  totalViews: number;
  uniqueViews: number;
  lastUpdated: number;
}

export class ViewTrackingService {
  private static readonly VIEWS_COLLECTION = 'memeViews';
  private static readonly VIEW_STATS_COLLECTION = 'viewStats';
  private static readonly SESSION_STORAGE_KEY = 'meme_session_id';
  
  // Generate or get session ID
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  }

  // Track a meme view
  static async trackView(memeId: string, userId?: string): Promise<void> {
    try {
      const sessionId = this.getSessionId();
      const viewId = `${memeId}_${sessionId}_${userId || 'anonymous'}`;
      
      // Check if this view already exists for this session
      const existingViewRef = doc(db, this.VIEWS_COLLECTION, viewId);
      const existingView = await getDoc(existingViewRef);
      
      if (existingView.exists()) {
        // Don't count duplicate views from same session
        return;
      }

      // Create new view record
      const viewData: MemeView = {
        id: viewId,
        memeId,
        userId: userId || 'anonymous',
        timestamp: Date.now(),
        sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      };

      // Use batch to update both view record and stats
      const batch = writeBatch(db);
      
      // Add view record
      batch.set(existingViewRef, viewData);
      
      // Update view stats
      const statsRef = doc(db, this.VIEW_STATS_COLLECTION, memeId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        // Update existing stats
        batch.update(statsRef, {
          totalViews: increment(1),
          uniqueViews: increment(userId ? 1 : 0), // Only count unique views for logged-in users
          lastUpdated: Date.now()
        });
      } else {
        // Create new stats
        batch.set(statsRef, {
          memeId,
          totalViews: 1,
          uniqueViews: userId ? 1 : 0,
          lastUpdated: Date.now()
        });
      }

      // Update meme document view count
      const memeRef = doc(db, 'memes', memeId);
      const memeDoc = await getDoc(memeRef);
      
      if (memeDoc.exists()) {
        const currentViews = memeDoc.data().views || 0;
        batch.update(memeRef, {
          views: currentViews + 1
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  // Get view stats for a meme
  static async getViewStats(memeId: string): Promise<ViewStats | null> {
    try {
      const statsRef = doc(db, this.VIEW_STATS_COLLECTION, memeId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data() as ViewStats;
      }
      return null;
    } catch (error) {
      console.error('Error getting view stats:', error);
      return null;
    }
  }

  // Get total views for multiple memes
  static async getBatchViewStats(memeIds: string[]): Promise<Record<string, ViewStats>> {
    try {
      const statsMap: Record<string, ViewStats> = {};
      
      // Firestore 'in' queries are limited to 10 items
      const batches = [];
      for (let i = 0; i < memeIds.length; i += 10) {
        batches.push(memeIds.slice(i, i + 10));
      }

      for (const batch of batches) {
        const promises = batch.map(async (memeId) => {
          const stats = await this.getViewStats(memeId);
          if (stats) {
            statsMap[memeId] = stats;
          }
        });
        
        await Promise.all(promises);
      }

      return statsMap;
    } catch (error) {
      console.error('Error getting batch view stats:', error);
      return {};
    }
  }

  // Get most viewed memes
  static async getMostViewedMemes(limitCount: number = 20): Promise<ViewStats[]> {
    try {
      const q = query(
        collection(db, this.VIEW_STATS_COLLECTION),
        orderBy('totalViews', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as ViewStats);
    } catch (error) {
      console.error('Error getting most viewed memes:', error);
      return [];
    }
  }

  // Get user's view history
  static async getUserViewHistory(userId: string, limitCount: number = 50): Promise<MemeView[]> {
    try {
      const q = query(
        collection(db, this.VIEWS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as MemeView);
    } catch (error) {
      console.error('Error getting user view history:', error);
      return [];
    }
  }

  // Get view count for a specific meme (from meme document)
  static async getMemeViewCount(memeId: string): Promise<number> {
    try {
      const memeRef = doc(db, 'memes', memeId);
      const memeDoc = await getDoc(memeRef);
      
      if (memeDoc.exists()) {
        return memeDoc.data().views || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting meme view count:', error);
      return 0;
    }
  }

  // Clean up old view records (keep only last 30 days)
  static async cleanupOldViews(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, this.VIEWS_COLLECTION),
        where('timestamp', '<', thirtyDaysAgo),
        limit(500) // Process in batches
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return;
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Recursively clean up more if there are more old records
      if (querySnapshot.size === 500) {
        await this.cleanupOldViews();
      }
    } catch (error) {
      console.error('Error cleaning up old views:', error);
    }
  }

  // Get trending memes based on recent views
  static async getTrendingMemes(hours: number = 24, limitCount: number = 20): Promise<string[]> {
    try {
      const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
      
      const q = query(
        collection(db, this.VIEWS_COLLECTION),
        where('timestamp', '>=', timeThreshold),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Count views per meme
      const viewCounts: Record<string, number> = {};
      querySnapshot.docs.forEach(doc => {
        const view = doc.data() as MemeView;
        viewCounts[view.memeId] = (viewCounts[view.memeId] || 0) + 1;
      });
      
      // Sort by view count and return top memes
      const sortedMemes = Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limitCount)
        .map(([memeId]) => memeId);
      
      return sortedMemes;
    } catch (error) {
      console.error('Error getting trending memes:', error);
      return [];
    }
  }

  // Check if user has viewed a meme
  static async hasUserViewedMeme(memeId: string, userId: string): Promise<boolean> {
    try {
      const sessionId = this.getSessionId();
      const viewId = `${memeId}_${sessionId}_${userId}`;
      
      const viewRef = doc(db, this.VIEWS_COLLECTION, viewId);
      const viewDoc = await getDoc(viewRef);
      
      return viewDoc.exists();
    } catch (error) {
      console.error('Error checking if user viewed meme:', error);
      return false;
    }
  }
}
