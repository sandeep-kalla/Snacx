import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Hashtag, 
  HashtagStats, 
  MemeHashtag,
  extractHashtags,
  isValidHashtag,
  categorizeHashtag 
} from '../types/hashtag';

export class HashtagService {
  private static readonly HASHTAGS_COLLECTION = 'hashtags';
  private static readonly MEME_HASHTAGS_COLLECTION = 'memeHashtags';
  private static readonly TRENDING_THRESHOLD = 10; // Minimum uses to be trending
  private static readonly TRENDING_DAYS = 7; // Days to consider for trending

  // Get hashtag by name
  static async getHashtag(name: string): Promise<Hashtag | null> {
    try {
      const docRef = doc(db, this.HASHTAGS_COLLECTION, name.toLowerCase());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Hashtag;
      }
      return null;
    } catch (error) {
      console.error('Error getting hashtag:', error);
      return null;
    }
  }

  // Create or update hashtag
  static async updateHashtag(name: string): Promise<void> {
    try {
      const normalizedName = name.toLowerCase();
      const docRef = doc(db, this.HASHTAGS_COLLECTION, normalizedName);
      const existing = await getDoc(docRef);
      
      if (existing.exists()) {
        // Update existing hashtag
        await updateDoc(docRef, {
          count: increment(1),
          lastUsed: Date.now(),
          trending: existing.data().count + 1 >= this.TRENDING_THRESHOLD
        });
      } else {
        // Create new hashtag
        const newHashtag: Omit<Hashtag, 'id'> = {
          name: normalizedName,
          count: 1,
          trending: false,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          category: categorizeHashtag(normalizedName)
        };
        
        await setDoc(docRef, newHashtag);
      }
    } catch (error) {
      console.error('Error updating hashtag:', error);
    }
  }

  // Process hashtags from content (memes or comments)
  static async processMemeHashtags(contentId: string, content: string): Promise<string[]> {
    try {
      const hashtags = extractHashtags(content);
      const validHashtags = hashtags.filter(isValidHashtag);

      if (validHashtags.length === 0) {
        return [];
      }

      // Update each hashtag count
      await Promise.all(
        validHashtags.map(hashtag => this.updateHashtag(hashtag))
      );

      // Store content-hashtag relationship
      const memeHashtag: MemeHashtag = {
        memeId: contentId, // This can be a meme ID or comment ID
        hashtags: validHashtags,
        createdAt: Date.now()
      };

      await setDoc(doc(db, this.MEME_HASHTAGS_COLLECTION, contentId), memeHashtag);

      console.log(`Processed hashtags for ${contentId}:`, validHashtags);
      return validHashtags;
    } catch (error) {
      console.error('Error processing hashtags:', error);
      return [];
    }
  }

  // Get trending hashtags
  static async getTrendingHashtags(limitCount: number = 20): Promise<Hashtag[]> {
    try {
      // Simplified query without orderBy to avoid composite index
      const q = query(
        collection(db, this.HASHTAGS_COLLECTION),
        where('trending', '==', true),
        limit(limitCount * 3) // Get more to filter and sort client-side
      );

      const querySnapshot = await getDocs(q);
      const hashtags: Hashtag[] = [];
      const sevenDaysAgo = Date.now() - (this.TRENDING_DAYS * 24 * 60 * 60 * 1000);

      querySnapshot.forEach((doc) => {
        const hashtag = { id: doc.id, ...doc.data() } as Hashtag;
        // Filter client-side for recent usage
        if (hashtag.lastUsed >= sevenDaysAgo) {
          hashtags.push(hashtag);
        }
      });

      // Sort by lastUsed and count, then limit
      hashtags.sort((a, b) => {
        if (b.lastUsed !== a.lastUsed) {
          return b.lastUsed - a.lastUsed;
        }
        return b.count - a.count;
      });

      return hashtags.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting trending hashtags:', error);
      // Fallback to popular hashtags if trending fails
      return this.getPopularHashtags(limitCount);
    }
  }

  // Get popular hashtags (by count)
  static async getPopularHashtags(limitCount: number = 50): Promise<Hashtag[]> {
    try {
      const q = query(
        collection(db, this.HASHTAGS_COLLECTION),
        orderBy('count', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const hashtags: Hashtag[] = [];
      
      querySnapshot.forEach((doc) => {
        hashtags.push({ id: doc.id, ...doc.data() } as Hashtag);
      });
      
      return hashtags;
    } catch (error) {
      console.error('Error getting popular hashtags:', error);
      return [];
    }
  }

  // Get recent hashtags
  static async getRecentHashtags(limitCount: number = 30): Promise<Hashtag[]> {
    try {
      const q = query(
        collection(db, this.HASHTAGS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const hashtags: Hashtag[] = [];
      
      querySnapshot.forEach((doc) => {
        hashtags.push({ id: doc.id, ...doc.data() } as Hashtag);
      });
      
      return hashtags;
    } catch (error) {
      console.error('Error getting recent hashtags:', error);
      return [];
    }
  }

  // Search hashtags
  static async searchHashtags(searchTerm: string, limitCount: number = 20): Promise<Hashtag[]> {
    try {
      const normalizedSearch = searchTerm.toLowerCase();
      
      // Firebase doesn't support full-text search, so we'll get all hashtags
      // and filter client-side for now. In production, you'd use Algolia or similar.
      const q = query(
        collection(db, this.HASHTAGS_COLLECTION),
        orderBy('count', 'desc'),
        limit(100) // Get more to filter from
      );
      
      const querySnapshot = await getDocs(q);
      const hashtags: Hashtag[] = [];
      
      querySnapshot.forEach((doc) => {
        const hashtag = { id: doc.id, ...doc.data() } as Hashtag;
        if (hashtag.name.includes(normalizedSearch)) {
          hashtags.push(hashtag);
        }
      });
      
      return hashtags.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching hashtags:', error);
      return [];
    }
  }

  // Get hashtag statistics
  static async getHashtagStats(): Promise<HashtagStats> {
    try {
      const [trending, popular, recent] = await Promise.all([
        this.getTrendingHashtags(10),
        this.getPopularHashtags(10),
        this.getRecentHashtags(10)
      ]);

      // Get total count (approximate)
      const totalQuery = query(collection(db, this.HASHTAGS_COLLECTION), limit(1000));
      const totalSnapshot = await getDocs(totalQuery);
      
      return {
        totalHashtags: totalSnapshot.size,
        trendingHashtags: trending.length,
        topHashtags: popular,
        recentHashtags: recent
      };
    } catch (error) {
      console.error('Error getting hashtag stats:', error);
      return {
        totalHashtags: 0,
        trendingHashtags: 0,
        topHashtags: [],
        recentHashtags: []
      };
    }
  }

  // Get memes by hashtag
  static async getMemesByHashtag(hashtag: string, limitCount: number = 20): Promise<string[]> {
    try {
      const normalizedHashtag = hashtag.toLowerCase();

      // Simplified query without orderBy to avoid composite index
      const q = query(
        collection(db, this.MEME_HASHTAGS_COLLECTION),
        where('hashtags', 'array-contains', normalizedHashtag),
        limit(limitCount * 2) // Get more to sort client-side
      );

      const querySnapshot = await getDocs(q);
      const memeData: Array<{id: string, createdAt: number}> = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        memeData.push({
          id: data.memeId || doc.id,
          createdAt: data.createdAt || 0
        });
      });

      // Sort client-side by creation date (newest first)
      memeData.sort((a, b) => b.createdAt - a.createdAt);

      return memeData.slice(0, limitCount).map(item => item.id);
    } catch (error) {
      console.error('Error getting memes by hashtag:', error);
      return [];
    }
  }

  // Remove hashtags when content (meme or comment) is deleted
  static async removeMemeHashtags(contentId: string): Promise<void> {
    try {
      console.log(`Removing hashtags for content: ${contentId}`);
      const contentHashtagDoc = await getDoc(doc(db, this.MEME_HASHTAGS_COLLECTION, contentId));

      if (contentHashtagDoc.exists()) {
        const data = contentHashtagDoc.data() as MemeHashtag;

        // Decrease count for each hashtag
        await Promise.all(
          data.hashtags.map(async (hashtag) => {
            const hashtagRef = doc(db, this.HASHTAGS_COLLECTION, hashtag);
            const hashtagDoc = await getDoc(hashtagRef);

            if (hashtagDoc.exists()) {
              const currentCount = hashtagDoc.data().count;
              const newCount = Math.max(0, currentCount - 1);

              console.log(`Updating hashtag #${hashtag} count from ${currentCount} to ${newCount}`);

              // Update hashtag count and trending status
              await updateDoc(hashtagRef, {
                count: newCount,
                trending: newCount >= this.TRENDING_THRESHOLD,
                lastUsed: newCount > 0 ? hashtagDoc.data().lastUsed : 0 // Reset lastUsed if count is 0
              });

              // If count is 0, consider removing the hashtag completely
              if (newCount === 0) {
                console.log(`Hashtag #${hashtag} count is now 0, marking as inactive`);
                // Instead of deleting, we'll mark it as inactive by setting trending to false
                // This preserves the hashtag history but removes it from trending
                await updateDoc(hashtagRef, {
                  trending: false,
                  lastUsed: 0
                });
              }
            }
          })
        );

        // Remove content-hashtag relationship
        await deleteDoc(doc(db, this.MEME_HASHTAGS_COLLECTION, contentId));
        console.log(`Removed hashtag relationship for content: ${contentId}`);
      } else {
        console.log(`No hashtags found for content: ${contentId}`);
      }
    } catch (error) {
      console.error('Error removing content hashtags:', error);
    }
  }
}
