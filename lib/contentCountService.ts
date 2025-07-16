import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export class ContentCountService {
  
  // Count active memes for a user
  static async getActiveMemeCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'memes'),
        where('authorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting active memes:', error);
      return 0;
    }
  }

  // Count active comments made by a user
  static async getActiveCommentCount(userId: string): Promise<number> {
    try {
      const q = query(collection(db, 'memes'));
      const querySnapshot = await getDocs(q);
      
      let commentCount = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const comments = data.comments || [];
        
        // Count comments made by this user
        const userComments = comments.filter((comment: any) => comment.userId === userId);
        commentCount += userComments.length;
      });
      
      return commentCount;
    } catch (error) {
      console.error('Error counting active comments:', error);
      return 0;
    }
  }

  // Count total likes received on active memes
  static async getTotalLikesReceived(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'memes'),
        where('authorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalLikes = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const likes = data.likes || [];
        totalLikes += likes.length;
      });
      
      return totalLikes;
    } catch (error) {
      console.error('Error counting total likes received:', error);
      return 0;
    }
  }

  // Count total comments received on active memes
  static async getTotalCommentsReceived(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'memes'),
        where('authorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalComments = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const comments = data.comments || [];
        totalComments += comments.length;
      });
      
      return totalComments;
    } catch (error) {
      console.error('Error counting total comments received:', error);
      return 0;
    }
  }

  // Get comprehensive user stats based on active content
  static async getUserActiveStats(userId: string) {
    try {
      const [activeMemes, activeComments, totalLikes, totalComments] = await Promise.all([
        this.getActiveMemeCount(userId),
        this.getActiveCommentCount(userId),
        this.getTotalLikesReceived(userId),
        this.getTotalCommentsReceived(userId)
      ]);

      return {
        activeMemes,
        activeComments,
        totalLikes,
        totalComments
      };
    } catch (error) {
      console.error('Error getting user active stats:', error);
      return {
        activeMemes: 0,
        activeComments: 0,
        totalLikes: 0,
        totalComments: 0
      };
    }
  }

  // Check if user has ever uploaded a meme (for first_meme achievement)
  static async hasEverUploadedMeme(userId: string): Promise<boolean> {
    try {
      // Check current active memes
      const activeMemes = await this.getActiveMemeCount(userId);
      if (activeMemes > 0) return true;

      // Check user profile for historical data
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check if user has ever uploaded (even if deleted)
        return userData.hasEverUploaded === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking if user has ever uploaded:', error);
      return false;
    }
  }

  // Check if user has ever received a like (for first_like achievement)
  static async hasEverReceivedLike(userId: string): Promise<boolean> {
    try {
      // Check current likes
      const totalLikes = await this.getTotalLikesReceived(userId);
      if (totalLikes > 0) return true;

      // Check user profile for historical data
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.hasEverReceivedLike === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking if user has ever received like:', error);
      return false;
    }
  }

  // Check if user has ever made a comment (for first_comment achievement)
  static async hasEverMadeComment(userId: string): Promise<boolean> {
    try {
      // Check current comments
      const activeComments = await this.getActiveCommentCount(userId);
      if (activeComments > 0) return true;

      // Check user profile for historical data
      const userDoc = await getDoc(doc(db, 'userProfiles', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.hasEverCommented === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking if user has ever commented:', error);
      return false;
    }
  }
}
