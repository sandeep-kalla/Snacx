import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { UserService } from './userService';
import { NotificationService } from './notificationService';

export interface Mention {
  id: string;
  mentionerId: string;
  mentionerName: string;
  mentionedUserId: string;
  mentionedUserName: string;
  contentType: 'comment' | 'reply';
  contentId: string;
  memeId: string;
  memeTitle: string;
  text: string;
  timestamp: number;
}

export class MentionService {
  private static readonly COLLECTION_NAME = 'mentions';

  // Extract mentions from text (e.g., "@username" patterns)
  static extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]); // Extract username without @
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }

  // Process mentions in content and create notifications
  static async processMentions(
    text: string,
    mentionerId: string,
    mentionerName: string,
    contentType: 'comment' | 'reply',
    contentId: string,
    memeId: string,
    memeTitle: string
  ): Promise<void> {
    try {
      const mentionedUsernames = this.extractMentions(text);
      
      if (mentionedUsernames.length === 0) return;

      // Get user profiles for mentioned usernames
      const mentionPromises = mentionedUsernames.map(async (username) => {
        try {
          const userProfile = await UserService.getUserByNickname(username);
          if (userProfile && userProfile.uid !== mentionerId) {
            // Create mention record
            const mention: Omit<Mention, 'id'> = {
              mentionerId,
              mentionerName,
              mentionedUserId: userProfile.uid,
              mentionedUserName: userProfile.nickname,
              contentType,
              contentId,
              memeId,
              memeTitle,
              text,
              timestamp: Date.now()
            };

            await addDoc(collection(db, this.COLLECTION_NAME), mention);

            // Create notification
            await NotificationService.createMentionNotification(
              mentionerId,
              userProfile.uid,
              memeId,
              memeTitle,
              contentType
            );
          }
        } catch (error) {
          console.error(`Error processing mention for ${username}:`, error);
        }
      });

      await Promise.all(mentionPromises);
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }

  // Get mentions for a user
  static async getUserMentions(userId: string, limitCount: number = 20): Promise<Mention[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('mentionedUserId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mention[];
    } catch (error) {
      console.error('Error getting user mentions:', error);
      return [];
    }
  }

  // Search users for mention autocomplete
  static async searchUsersForMention(query: string, currentUserId: string): Promise<Array<{uid: string, nickname: string, avatar: string}>> {
    try {
      if (query.length < 1) return [];

      // Get followed users first (they should appear at the top)
      const followedUsers = await UserService.getFollowedUsers(currentUserId);
      
      // Filter by query
      const filteredUsers = followedUsers
        .filter(user => 
          user.nickname.toLowerCase().includes(query.toLowerCase()) &&
          user.uid !== currentUserId
        )
        .slice(0, 5); // Limit to 5 suggestions

      return filteredUsers.map(user => ({
        uid: user.uid,
        nickname: user.nickname,
        avatar: user.avatar
      }));
    } catch (error) {
      console.error('Error searching users for mention:', error);
      return [];
    }
  }

  // Format text with mentions highlighted
  static formatTextWithMentions(text: string): string {
    return text.replace(/@(\w+)/g, '<span class="text-primary font-medium">@$1</span>');
  }

  // Get mention data for rendering (returns data, not JSX)
  static getMentionParts(text: string): Array<{text: string, isMention: boolean, username?: string}> {
    const parts = text.split(/(@\w+)/g);

    return parts.map((part) => {
      if (part.match(/^@\w+$/)) {
        const username = part.substring(1);
        return {
          text: part,
          isMention: true,
          username
        };
      }
      return {
        text: part,
        isMention: false
      };
    });
  }
}
