import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types/user';
import { ChatRoom } from './chatService';

export interface UserInteractionScore {
  userId: string;
  score: number;
  lastInteraction: number;
  interactions: {
    likes: number;
    comments: number;
    follows: number;
    messages: number;
    views: number;
  };
}

export class InteractionSortingService {
  
  // Calculate interaction score between current user and target user
  static async calculateUserInteractionScore(
    currentUserId: string, 
    targetUserId: string
  ): Promise<UserInteractionScore> {
    try {
      const interactions = {
        likes: 0,
        comments: 0,
        follows: 0,
        messages: 0,
        views: 0
      };
      
      let lastInteraction = 0;

      // Get likes given to target user's memes
      const likesQuery = query(
        collection(db, 'userInteractions'),
        where('userId', '==', currentUserId),
        where('type', '==', 'like')
      );
      const likesSnapshot = await getDocs(likesQuery);
      
      // Count likes on target user's memes
      for (const doc of likesSnapshot.docs) {
        const interaction = doc.data();
        // Check if the liked meme belongs to target user
        const memeQuery = query(
          collection(db, 'memes'),
          where('__name__', '==', interaction.targetId),
          where('authorId', '==', targetUserId)
        );
        const memeSnapshot = await getDocs(memeQuery);
        if (!memeSnapshot.empty) {
          interactions.likes++;
          lastInteraction = Math.max(lastInteraction, interaction.createdAt || 0);
        }
      }

      // Get comments on target user's memes
      const memesQuery = query(
        collection(db, 'memes'),
        where('authorId', '==', targetUserId)
      );
      const memesSnapshot = await getDocs(memesQuery);
      
      memesSnapshot.docs.forEach(doc => {
        const meme = doc.data();
        const comments = meme.comments || [];
        const userComments = comments.filter((comment: any) => comment.userId === currentUserId);
        interactions.comments += userComments.length;
        
        userComments.forEach((comment: any) => {
          lastInteraction = Math.max(lastInteraction, comment.timestamp || 0);
        });
      });

      // Check if following
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', currentUserId),
        where('followingId', '==', targetUserId)
      );
      const followSnapshot = await getDocs(followQuery);
      if (!followSnapshot.empty) {
        interactions.follows = 1;
        const followData = followSnapshot.docs[0].data();
        lastInteraction = Math.max(lastInteraction, followData.createdAt || 0);
      }

      // Get chat messages between users
      const chatQuery = query(
        collection(db, 'chatMessages'),
        where('senderId', '==', currentUserId)
      );
      const chatSnapshot = await getDocs(chatQuery);
      
      chatSnapshot.docs.forEach(doc => {
        const message = doc.data();
        // Check if message is in a direct chat with target user
        if (message.chatId && message.chatId.includes(targetUserId)) {
          interactions.messages++;
          lastInteraction = Math.max(lastInteraction, message.timestamp || 0);
        }
      });

      // Calculate weighted score
      const score = (
        interactions.likes * 3 +           // Likes are worth 3 points
        interactions.comments * 5 +        // Comments are worth 5 points
        interactions.follows * 10 +        // Following is worth 10 points
        interactions.messages * 7 +        // Messages are worth 7 points
        interactions.views * 1             // Views are worth 1 point
      );

      return {
        userId: targetUserId,
        score,
        lastInteraction,
        interactions
      };
    } catch (error) {
      console.error('Error calculating interaction score:', error);
      return {
        userId: targetUserId,
        score: 0,
        lastInteraction: 0,
        interactions: {
          likes: 0,
          comments: 0,
          follows: 0,
          messages: 0,
          views: 0
        }
      };
    }
  }

  // Sort users by interaction level with current user
  static async sortUsersByInteraction(
    currentUserId: string,
    users: UserProfile[]
  ): Promise<UserProfile[]> {
    try {
      // Calculate interaction scores for all users
      const userScores = await Promise.all(
        users.map(user => this.calculateUserInteractionScore(currentUserId, user.uid))
      );

      // Create a map of userId to score
      const scoreMap = new Map<string, UserInteractionScore>();
      userScores.forEach(score => {
        scoreMap.set(score.userId, score);
      });

      // Sort users by interaction score (highest first), then by last interaction time
      const sortedUsers = users.sort((a, b) => {
        const scoreA = scoreMap.get(a.uid);
        const scoreB = scoreMap.get(b.uid);
        
        if (!scoreA || !scoreB) return 0;
        
        // Primary sort: by interaction score
        if (scoreA.score !== scoreB.score) {
          return scoreB.score - scoreA.score;
        }
        
        // Secondary sort: by last interaction time (more recent first)
        return scoreB.lastInteraction - scoreA.lastInteraction;
      });

      return sortedUsers;
    } catch (error) {
      console.error('Error sorting users by interaction:', error);
      return users; // Return original order if sorting fails
    }
  }

  // Get interaction summary for display
  static getInteractionSummary(score: UserInteractionScore): string {
    const { interactions } = score;
    const parts: string[] = [];
    
    if (interactions.follows > 0) parts.push('Following');
    if (interactions.messages > 0) parts.push(`${interactions.messages} messages`);
    if (interactions.likes > 0) parts.push(`${interactions.likes} likes`);
    if (interactions.comments > 0) parts.push(`${interactions.comments} comments`);
    
    return parts.length > 0 ? parts.join(', ') : 'No interactions';
  }

  // Simple sorting for quick use (based on recent activity)
  static sortByRecentActivity(users: UserProfile[]): UserProfile[] {
    return users.sort((a, b) => {
      // Sort by last activity or creation time
      const timeA = a.stats?.joinedAt || a.createdAt || 0;
      const timeB = b.stats?.joinedAt || b.createdAt || 0;
      return timeB - timeA;
    });
  }

  // Sort chats by interaction level
  static async sortChatsByInteraction(currentUserId: string, chats: ChatRoom[]): Promise<ChatRoom[]> {
    try {
      // For now, sort by last activity time
      // In the future, this can be enhanced with interaction scoring
      return chats.sort((a, b) => {
        const timeA = a.lastActivity || a.createdAt || 0;
        const timeB = b.lastActivity || b.createdAt || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error sorting chats by interaction:', error);
      return chats;
    }
  }
}
