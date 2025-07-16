import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment, CommentReply } from '../types/follow';

export class CommentService {
  private static readonly COMMENTS_COLLECTION = 'comments';
  private static readonly REPLIES_COLLECTION = 'commentReplies';

  // Add a reply to a comment
  static async addReply(
    memeId: string,
    parentCommentId: string,
    userId: string,
    userName: string,
    text: string
  ): Promise<CommentReply> {
    try {
      console.log('Adding reply:', { memeId, parentCommentId, userId, userName, text });

      const replyRef = doc(collection(db, this.REPLIES_COLLECTION));
      const reply: CommentReply = {
        id: replyRef.id,
        userId,
        userName,
        text: text.trim(),
        timestamp: Date.now(),
        parentCommentId,
        memeId
      };

      console.log('Reply object to save:', reply);
      await setDoc(replyRef, reply);
      console.log('Reply saved successfully');

      // Update the parent comment's reply count
      await this.updateCommentReplyCount(memeId, parentCommentId, 1);

      return reply;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }

  // Get replies for a comment
  static async getCommentReplies(parentCommentId: string): Promise<CommentReply[]> {
    try {
      console.log('Getting replies for parentCommentId:', parentCommentId);

      const q = query(
        collection(db, this.REPLIES_COLLECTION),
        where('parentCommentId', '==', parentCommentId)
      );

      const querySnapshot = await getDocs(q);
      const replies = querySnapshot.docs.map(doc => doc.data() as CommentReply);

      // Sort by timestamp on client side
      replies.sort((a, b) => a.timestamp - b.timestamp);

      console.log('Found replies:', replies.length, replies);
      return replies;
    } catch (error) {
      console.error('Error getting comment replies:', error);
      console.error('Error details:', error);
      return [];
    }
  }

  // Delete a reply
  static async deleteReply(replyId: string, memeId: string, parentCommentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.REPLIES_COLLECTION, replyId));
      
      // Update the parent comment's reply count
      await this.updateCommentReplyCount(memeId, parentCommentId, -1);
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  }

  // Update comment reply count in the meme document
  private static async updateCommentReplyCount(
    memeId: string, 
    commentId: string, 
    increment: number
  ): Promise<void> {
    try {
      const memeRef = doc(db, 'memes', memeId);
      const memeDoc = await getDoc(memeRef);
      
      if (memeDoc.exists()) {
        const memeData = memeDoc.data();
        const comments = memeData.comments || [];
        
        // Find the comment and update its reply count
        const updatedComments = comments.map((comment: any) => {
          if (comment.timestamp.toString() === commentId || comment.id === commentId) {
            return {
              ...comment,
              replyCount: Math.max(0, (comment.replyCount || 0) + increment)
            };
          }
          return comment;
        });

        await updateDoc(memeRef, { comments: updatedComments });
      }
    } catch (error) {
      console.error('Error updating comment reply count:', error);
    }
  }

  // Get all replies for multiple comments (batch operation)
  static async getBatchCommentReplies(commentIds: string[]): Promise<Record<string, CommentReply[]>> {
    try {
      if (commentIds.length === 0) return {};

      const repliesMap: Record<string, CommentReply[]> = {};
      
      // Firestore 'in' queries are limited to 10 items, so we need to batch
      const batches = [];
      for (let i = 0; i < commentIds.length; i += 10) {
        batches.push(commentIds.slice(i, i + 10));
      }

      for (const batch of batches) {
        const q = query(
          collection(db, this.REPLIES_COLLECTION),
          where('parentCommentId', 'in', batch),
          orderBy('timestamp', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach(doc => {
          const reply = doc.data() as CommentReply;
          if (!repliesMap[reply.parentCommentId]) {
            repliesMap[reply.parentCommentId] = [];
          }
          repliesMap[reply.parentCommentId].push(reply);
        });
      }

      return repliesMap;
    } catch (error) {
      console.error('Error getting batch comment replies:', error);
      return {};
    }
  }

  // Delete all replies for a comment (when comment is deleted)
  static async deleteAllRepliesForComment(parentCommentId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.REPLIES_COLLECTION),
        where('parentCommentId', '==', parentCommentId)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting all replies for comment:', error);
      throw error;
    }
  }

  // Get reply count for a comment
  static async getReplyCount(parentCommentId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.REPLIES_COLLECTION),
        where('parentCommentId', '==', parentCommentId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting reply count:', error);
      return 0;
    }
  }

  // Search replies by text
  static async searchReplies(searchTerm: string, limitCount: number = 20): Promise<CommentReply[]> {
    try {
      // Note: This is a simple implementation. For production, consider using 
      // a search service like Algolia or Elasticsearch for better text search
      const q = query(
        collection(db, this.REPLIES_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount * 5) // Get more to filter locally
      );
      
      const querySnapshot = await getDocs(q);
      const allReplies = querySnapshot.docs.map(doc => doc.data() as CommentReply);
      
      // Filter locally (not ideal for large datasets)
      const filteredReplies = allReplies.filter(reply =>
        reply.text.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limitCount);

      return filteredReplies;
    } catch (error) {
      console.error('Error searching replies:', error);
      return [];
    }
  }

  // Get recent replies by user
  static async getUserRecentReplies(userId: string, limitCount: number = 20): Promise<CommentReply[]> {
    try {
      const q = query(
        collection(db, this.REPLIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as CommentReply);
    } catch (error) {
      console.error('Error getting user recent replies:', error);
      return [];
    }
  }

  // Clean up orphaned replies (replies whose parent comments no longer exist)
  static async cleanupOrphanedReplies(): Promise<void> {
    try {
      // This would be run as a maintenance task
      const repliesQuery = query(collection(db, this.REPLIES_COLLECTION));
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const replyDoc of repliesSnapshot.docs) {
        const reply = replyDoc.data() as CommentReply;
        
        // Check if parent comment still exists in the meme
        const memeRef = doc(db, 'memes', reply.memeId);
        const memeDoc = await getDoc(memeRef);
        
        if (memeDoc.exists()) {
          const memeData = memeDoc.data();
          const comments = memeData.comments || [];
          const parentExists = comments.some((comment: any) => 
            comment.timestamp.toString() === reply.parentCommentId || comment.id === reply.parentCommentId
          );
          
          if (!parentExists) {
            batch.delete(replyDoc.ref);
            batchCount++;
            
            // Firestore batch limit is 500 operations
            if (batchCount >= 500) {
              await batch.commit();
              batchCount = 0;
            }
          }
        } else {
          // Meme doesn't exist, delete the reply
          batch.delete(replyDoc.ref);
          batchCount++;
          
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error cleaning up orphaned replies:', error);
    }
  }
}
