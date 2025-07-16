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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { NotificationData } from '../types/follow';

export class NotificationService {
  private static readonly NOTIFICATIONS_COLLECTION = 'notifications';

  // Create a new notification
  static async createNotification(notification: Omit<NotificationData, 'id'>): Promise<string> {
    try {
      // Validate required fields
      if (!notification.userId || !notification.type || !notification.message) {
        throw new Error('Missing required notification fields');
      }

      const notificationRef = doc(collection(db, this.NOTIFICATIONS_COLLECTION));
      const notificationData: NotificationData = {
        id: notificationRef.id,
        ...notification,
        createdAt: notification.createdAt || Date.now(),
        read: notification.read || false
      };

      await setDoc(notificationRef, notificationData);
      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      console.error('Notification data that failed:', notification);
      throw error;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<NotificationData[]> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as NotificationData);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.NOTIFICATIONS_COLLECTION, notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.NOTIFICATIONS_COLLECTION, notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all notifications for a user
  static async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // Create like notification
  static async createLikeNotification(
    likedByUserId: string,
    memeAuthorId: string,
    memeId: string,
    memeTitle: string
  ): Promise<void> {
    // Don't notify self
    if (likedByUserId === memeAuthorId) {
      return;
    }

    // Validate inputs
    if (!likedByUserId || !memeAuthorId || !memeId || !memeTitle) {
      console.error('Invalid parameters for like notification:', {
        likedByUserId, memeAuthorId, memeId, memeTitle
      });
      return;
    }

    try {
      const notificationData = {
        userId: memeAuthorId,
        fromUserId: likedByUserId,
        type: 'like' as const,
        targetId: memeId,
        message: 'liked your meme',
        read: false,
        createdAt: Date.now(),
        metadata: {
          memeTitle: memeTitle.substring(0, 100) // Limit title length
        }
      };

      await this.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating like notification:', error);
      console.error('Full error details:', {
        error,
        likedByUserId,
        memeAuthorId,
        memeId,
        memeTitle
      });
      // Don't throw - we don't want to break the like functionality if notifications fail
    }
  }

  // Create comment notification
  static async createCommentNotification(
    commentByUserId: string, 
    memeAuthorId: string, 
    memeId: string, 
    memeTitle: string,
    commentText: string
  ): Promise<void> {
    if (commentByUserId === memeAuthorId) return; // Don't notify self

    try {
      await this.createNotification({
        userId: memeAuthorId,
        fromUserId: commentByUserId,
        type: 'comment',
        targetId: memeId,
        message: 'commented on your meme',
        read: false,
        createdAt: Date.now(),
        metadata: {
          memeTitle,
          commentText: commentText.substring(0, 100) // Truncate long comments
        }
      });
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  }

  // Create reply notification
  static async createReplyNotification(
    replyByUserId: string, 
    originalCommentUserId: string, 
    memeId: string, 
    memeTitle: string,
    replyText: string
  ): Promise<void> {
    if (replyByUserId === originalCommentUserId) return; // Don't notify self

    try {
      await this.createNotification({
        userId: originalCommentUserId,
        fromUserId: replyByUserId,
        type: 'reply',
        targetId: memeId,
        message: 'replied to your comment',
        read: false,
        createdAt: Date.now(),
        metadata: {
          memeTitle,
          commentText: replyText.substring(0, 100)
        }
      });
    } catch (error) {
      console.error('Error creating reply notification:', error);
    }
  }

  // Create mention notification
  static async createMentionNotification(
    mentionByUserId: string,
    mentionedUserId: string,
    memeId: string,
    memeTitle: string,
    contentType: 'comment' | 'reply'
  ): Promise<void> {
    try {
      // Don't notify if user mentions themselves
      if (mentionByUserId === mentionedUserId) return;

      await this.createNotification({
        userId: mentionedUserId,
        fromUserId: mentionByUserId,
        type: 'mention',
        targetId: memeId,
        message: `mentioned you in a ${contentType}`,
        read: false,
        createdAt: Date.now(),
        metadata: {
          memeTitle,
          contentType
        }
      });
    } catch (error) {
      console.error('Error creating mention notification:', error);
    }
  }

  // Create achievement notification
  static async createAchievementNotification(
    userId: string, 
    achievementName: string,
    achievementIcon: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        fromUserId: userId, // Self notification
        type: 'achievement',
        message: `unlocked the "${achievementName}" achievement!`,
        read: false,
        createdAt: Date.now(),
        metadata: {
          achievementName,
          achievementIcon
        }
      });
    } catch (error) {
      console.error('Error creating achievement notification:', error);
    }
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, this.NOTIFICATIONS_COLLECTION),
        where('createdAt', '<', thirtyDaysAgo)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Create chat message notification
  static async createChatMessageNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    chatId: string,
    chatName?: string,
    isGroup: boolean = false
  ): Promise<void> {
    try {
      // Don't send notification to self
      if (recipientId === senderId) return;

      const message = isGroup
        ? `${senderName} sent a message in ${chatName || 'group chat'}`
        : `${senderName} sent you a message`;

      await this.createNotification({
        userId: recipientId,
        fromUserId: senderId,
        type: 'chat_message',
        targetId: chatId,
        message,
        read: false,
        createdAt: Date.now(),
        metadata: {
          chatId,
          chatName,
          isGroup,
          senderName
        }
      });
    } catch (error) {
      console.error('Error creating chat message notification:', error);
    }
  }

  // Create group addition notification
  static async createGroupAddedNotification(
    newMemberId: string,
    adminId: string,
    adminName: string,
    groupId: string,
    groupName: string
  ): Promise<void> {
    try {
      // Don't send notification to self
      if (newMemberId === adminId) return;

      const message = `${adminName} added you to the group "${groupName}"`;

      await this.createNotification({
        userId: newMemberId,
        fromUserId: adminId,
        type: 'group_added',
        targetId: groupId,
        message,
        read: false,
        createdAt: Date.now(),
        metadata: {
          groupId,
          groupName,
          adminName
        }
      });
    } catch (error) {
      console.error('Error creating group added notification:', error);
    }
  }

  // Create group admin promotion notification
  static async createGroupAdminNotification(
    newAdminId: string,
    promoterId: string,
    promoterName: string,
    groupId: string,
    groupName: string
  ): Promise<void> {
    try {
      // Don't send notification to self
      if (newAdminId === promoterId) return;

      const message = `${promoterName} made you an admin in "${groupName}"`;

      await this.createNotification({
        userId: newAdminId,
        fromUserId: promoterId,
        type: 'group_admin',
        targetId: groupId,
        message,
        read: false,
        createdAt: Date.now(),
        metadata: {
          groupId,
          groupName,
          promoterName
        }
      });
    } catch (error) {
      console.error('Error creating group admin notification:', error);
    }
  }

  // Create group removal notification
  static async createGroupRemovedNotification(
    removedMemberId: string,
    adminId: string,
    adminName: string,
    groupName: string
  ): Promise<void> {
    try {
      // Don't send notification to self
      if (removedMemberId === adminId) return;

      const message = `${adminName} removed you from the group "${groupName}"`;

      await this.createNotification({
        userId: removedMemberId,
        fromUserId: adminId,
        type: 'group_removed',
        message,
        read: false,
        createdAt: Date.now(),
        metadata: {
          groupName,
          adminName
        }
      });
    } catch (error) {
      console.error('Error creating group removed notification:', error);
    }
  }
}
