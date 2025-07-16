import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { Meme } from '../types/meme';

export class MemeService {
  private static readonly COLLECTION_NAME = 'memes';

  // Get meme by ID
  static async getMemeById(memeId: string): Promise<Meme | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, memeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Meme;
      }
      return null;
    } catch (error) {
      console.error('Error getting meme by ID:', error);
      return null;
    }
  }

  // Get recent memes
  static async getRecentMemes(limitCount: number = 20): Promise<Meme[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const memes: Meme[] = [];
      
      querySnapshot.forEach((doc) => {
        memes.push({ id: doc.id, ...doc.data() } as Meme);
      });
      
      return memes;
    } catch (error) {
      console.error('Error getting recent memes:', error);
      return [];
    }
  }

  // Get memes by author
  static async getMemesByAuthor(authorId: string, limitCount: number = 20): Promise<Meme[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const memes: Meme[] = [];
      
      querySnapshot.forEach((doc) => {
        memes.push({ id: doc.id, ...doc.data() } as Meme);
      });
      
      return memes;
    } catch (error) {
      console.error('Error getting memes by author:', error);
      return [];
    }
  }

  // Get trending memes (by likes)
  static async getTrendingMemes(limitCount: number = 20): Promise<Meme[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount * 3) // Get more to sort by likes
      );
      
      const querySnapshot = await getDocs(q);
      const memes: Meme[] = [];
      
      querySnapshot.forEach((doc) => {
        memes.push({ id: doc.id, ...doc.data() } as Meme);
      });
      
      // Sort by likes count and return top ones
      memes.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      
      return memes.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting trending memes:', error);
      return [];
    }
  }

  // Search memes by title
  static async searchMemes(searchTerm: string, limitCount: number = 20): Promise<Meme[]> {
    try {
      // Firebase doesn't support full-text search, so we'll get recent memes
      // and filter client-side. In production, you'd use Algolia or similar.
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(100) // Get more to filter from
      );
      
      const querySnapshot = await getDocs(q);
      const memes: Meme[] = [];
      const normalizedSearch = searchTerm.toLowerCase();
      
      querySnapshot.forEach((doc) => {
        const meme = { id: doc.id, ...doc.data() } as Meme;
        if (meme.title.toLowerCase().includes(normalizedSearch)) {
          memes.push(meme);
        }
      });
      
      return memes.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching memes:', error);
      return [];
    }
  }

  // Get memes by multiple user IDs (for following feed)
  static async getMemesByUsers(userIds: string[], limitCount: number = 50): Promise<Meme[]> {
    if (userIds.length === 0) {
      return [];
    }

    try {
      console.log('Getting memes for user IDs:', userIds);
      const memes: Meme[] = [];

      // Firestore 'in' queries are limited to 10 items, so we need to batch them
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        batches.push(batch);
      }

      console.log('Batches to query:', batches);

      // Execute all batches in parallel
      const batchPromises = batches.map(async (batch) => {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('authorId', 'in', batch)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Meme));
      });

      const batchResults = await Promise.all(batchPromises);

      // Flatten and combine all results
      batchResults.forEach(batchMemes => {
        memes.push(...batchMemes);
      });

      // Sort by creation date and limit results
      const sortedMemes = memes
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limitCount);

      console.log('Final sorted memes:', sortedMemes.length, sortedMemes);
      return sortedMemes;

    } catch (error) {
      console.error('Error getting memes by users:', error);
      return [];
    }
  }
}
