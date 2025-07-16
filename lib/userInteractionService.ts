import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserInteraction } from '../types/follow';

export class UserInteractionService {
  private static readonly INTERACTIONS_COLLECTION = 'userInteractions';

  // Add a user interaction (like, bookmark, etc.)
  static async addInteraction(
    userId: string, 
    targetId: string, 
    type: 'like' | 'bookmark' | 'follow',
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const interactionId = `${userId}_${type}_${targetId}`;
      const interaction: UserInteraction = {
        id: interactionId,
        userId,
        targetId,
        type,
        createdAt: Date.now(),
        metadata
      };

      await setDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId), interaction);
      return interactionId;
    } catch (error) {
      console.error('Error adding interaction:', error);
      throw error;
    }
  }

  // Remove a user interaction
  static async removeInteraction(
    userId: string, 
    targetId: string, 
    type: 'like' | 'bookmark' | 'follow'
  ): Promise<void> {
    try {
      const interactionId = `${userId}_${type}_${targetId}`;
      await deleteDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId));
    } catch (error) {
      console.error('Error removing interaction:', error);
      throw error;
    }
  }

  // Check if user has interacted with target
  static async hasInteraction(
    userId: string, 
    targetId: string, 
    type: 'like' | 'bookmark' | 'follow'
  ): Promise<boolean> {
    try {
      const interactionId = `${userId}_${type}_${targetId}`;
      const interactionDoc = await getDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId));
      return interactionDoc.exists();
    } catch (error) {
      console.error('Error checking interaction:', error);
      return false;
    }
  }

  // Get user's liked memes
  static async getUserLikedMemes(userId: string, limitCount: number = 50): Promise<UserInteraction[]> {
    try {
      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('userId', '==', userId),
        where('type', '==', 'like'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || Date.now()
      } as UserInteraction));
    } catch (error) {
      console.error('Error getting liked memes:', error);
      return [];
    }
  }

  // Get user's bookmarked memes
  static async getUserBookmarkedMemes(userId: string, limitCount: number = 50): Promise<UserInteraction[]> {
    try {
      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('userId', '==', userId),
        where('type', '==', 'bookmark'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || Date.now()
      } as UserInteraction));
    } catch (error) {
      console.error('Error getting bookmarked memes:', error);
      return [];
    }
  }

  // Get interaction counts for a target (e.g., how many likes a meme has)
  static async getInteractionCount(targetId: string, type: 'like' | 'bookmark'): Promise<number> {
    try {
      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('targetId', '==', targetId),
        where('type', '==', type)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting interaction count:', error);
      return 0;
    }
  }

  // Get users who interacted with a target
  static async getInteractionUsers(
    targetId: string, 
    type: 'like' | 'bookmark',
    limitCount: number = 50
  ): Promise<UserInteraction[]> {
    try {
      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('targetId', '==', targetId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserInteraction);
    } catch (error) {
      console.error('Error getting interaction users:', error);
      return [];
    }
  }

  // Get user's interaction history
  static async getUserInteractionHistory(
    userId: string, 
    type?: 'like' | 'bookmark' | 'follow',
    limitCount: number = 100
  ): Promise<UserInteraction[]> {
    try {
      let q;
      if (type) {
        q = query(
          collection(db, this.INTERACTIONS_COLLECTION),
          where('userId', '==', userId),
          where('type', '==', type),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, this.INTERACTIONS_COLLECTION),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserInteraction);
    } catch (error) {
      console.error('Error getting user interaction history:', error);
      return [];
    }
  }

  // Bulk add interactions (for migration or batch operations)
  static async bulkAddInteractions(interactions: Omit<UserInteraction, 'id'>[]): Promise<void> {
    try {
      const promises = interactions.map(interaction => {
        const interactionId = `${interaction.userId}_${interaction.type}_${interaction.targetId}`;
        const fullInteraction: UserInteraction = {
          id: interactionId,
          ...interaction
        };
        return setDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId), fullInteraction);
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk adding interactions:', error);
      throw error;
    }
  }

  // Clean up interactions for deleted content
  static async cleanupInteractionsForTarget(targetId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('targetId', '==', targetId)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up interactions for target:', error);
      throw error;
    }
  }
}
