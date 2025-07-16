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
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { NotificationService } from './notificationService';

export interface ChatRoom {
  id: string;
  name?: string;
  description?: string;
  avatar?: string; // Group avatar URL or emoji
  type: 'direct' | 'group';
  participants: string[];
  admins?: string[]; // Group admins (for group chats)
  createdBy: string;
  createdAt: number;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: number;
    type: 'text' | 'meme' | 'image';
  };
  lastActivity: number;
  isActive: boolean;
  settings?: {
    allowInvites?: boolean; // Can members invite others
    onlyAdminsCanMessage?: boolean; // Only admins can send messages
    muteNotifications?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'meme' | 'image' | 'system';
  timestamp: number;
  memeData?: {
    memeId: string;
    title: string;
    imageUrl: string;
    authorName: string;
    publicId?: string;
  };
  readBy: string[];
  edited?: boolean;
  editedAt?: number;
  replyTo?: string; // Message ID this is replying to
  reactions?: { [emoji: string]: string[] }; // emoji -> array of user IDs
  deleted?: boolean;
  deletedAt?: number;
}

export class ChatService {
  private static readonly CHAT_ROOMS_COLLECTION = 'chatRooms';
  private static readonly CHAT_MESSAGES_COLLECTION = 'chatMessages';

  // Create a direct chat between two users
  static async createDirectChat(userId1: string, userId2: string): Promise<ChatRoom> {
    try {
      // Check if direct chat already exists
      const existingChat = await this.getDirectChat(userId1, userId2);
      if (existingChat) {
        return existingChat;
      }

      const chatId = `direct_${[userId1, userId2].sort().join('_')}`;
      const chatRoom: ChatRoom = {
        id: chatId,
        type: 'direct',
        participants: [userId1, userId2],
        createdBy: userId1,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true
      };

      console.log('Creating direct chat with data:', chatRoom);
      await setDoc(doc(db, this.CHAT_ROOMS_COLLECTION, chatId), chatRoom);
      return chatRoom;
    } catch (error) {
      console.error('Error creating direct chat:', error);
      throw error;
    }
  }

  // Create a group chat
  static async createGroupChat(
    creatorId: string,
    participants: string[],
    groupName: string,
    description?: string,
    avatar?: string
  ): Promise<ChatRoom> {
    try {
      // All participants can be added to group chat

      const chatRef = doc(collection(db, this.CHAT_ROOMS_COLLECTION));
      const chatRoom: any = {
        id: chatRef.id,
        name: groupName,
        type: 'group',
        participants: [creatorId, ...participants.filter(p => p !== creatorId)],
        admins: [creatorId], // Creator is the first admin
        createdBy: creatorId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true,
        settings: {
          allowInvites: true,
          onlyAdminsCanMessage: false,
          muteNotifications: false
        },
        // Only include optional fields if they have values
        ...(description && { description }),
        ...(avatar && { avatar })
      };

      const batch = writeBatch(db);

      // Create the chat room
      batch.set(chatRef, chatRoom);

      // Send system message about group creation
      const systemMessageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId: chatRef.id,
        senderId: 'system',
        senderName: 'System',
        text: `${groupName} group was created`,
        type: 'system',
        timestamp: Date.now(),
        readBy: [creatorId]
      };
      batch.set(systemMessageRef, systemMessage);

      await batch.commit();
      return chatRoom;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  // Get direct chat between two users
  static async getDirectChat(userId1: string, userId2: string): Promise<ChatRoom | null> {
    try {
      const chatId = `direct_${[userId1, userId2].sort().join('_')}`;
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        return chatDoc.data() as ChatRoom;
      }
      return null;
    } catch (error) {
      console.error('Error getting direct chat:', error);
      return null;
    }
  }

  // Get user's chat rooms
  static async getUserChats(userId: string): Promise<ChatRoom[]> {
    try {
      console.log('Getting chats for user:', userId);

      const q = query(
        collection(db, this.CHAT_ROOMS_COLLECTION),
        where('participants', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);
      const allChats = querySnapshot.docs.map(doc => doc.data() as ChatRoom);

      // Filter active chats and sort on client side
      const activeChats = allChats
        .filter(chat => chat.isActive !== false)
        .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

      console.log('Found chats:', activeChats.length, activeChats);
      return activeChats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  // Get a chat room by ID
  static async getChatRoom(chatId: string): Promise<ChatRoom | null> {
    try {
      const chatDoc = await getDoc(doc(db, this.CHAT_ROOMS_COLLECTION, chatId));
      if (!chatDoc.exists()) {
        return null;
      }
      return { id: chatDoc.id, ...chatDoc.data() } as ChatRoom;
    } catch (error) {
      console.error('Error getting chat room:', error);
      return null;
    }
  }

  // Send a text message
  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
    replyToId?: string
  ): Promise<ChatMessage> {
    try {
      // Get chat room to check permissions
      const chatRoom = await this.getChatRoom(chatId);
      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      // Skip participant check for system messages
      if (senderId !== 'system') {
        // Check if sender is participant
        if (!chatRoom.participants.includes(senderId)) {
          throw new Error('User is not a participant in this chat');
        }

        // Check if only admins can message (for groups)
        if (chatRoom.type === 'group' && chatRoom.settings?.onlyAdminsCanMessage) {
          if (!chatRoom.admins?.includes(senderId)) {
            throw new Error('Only admins can send messages in this group');
          }
        }
      }

      // All users can send messages in chat

      const messageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const message: ChatMessage = {
        id: messageRef.id,
        chatId,
        senderId,
        senderName,
        text,
        type: 'text',
        timestamp: Date.now(),
        readBy: [senderId],
        ...(replyToId && { replyTo: replyToId }) // Only include if not undefined
      };

      const batch = writeBatch(db);

      // Add message
      batch.set(messageRef, message);

      // Update chat room last message and activity
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      batch.update(chatRef, {
        lastMessage: {
          text,
          senderId,
          timestamp: message.timestamp,
          type: 'text'
        },
        lastActivity: message.timestamp
      });

      await batch.commit();

      // Send notifications to other participants (but not to sender)
      try {
        const otherParticipants = chatRoom.participants.filter(id => id !== senderId);

        for (const participantId of otherParticipants) {
          await NotificationService.createChatMessageNotification(
            participantId,
            senderId,
            senderName,
            chatId,
            chatRoom.name,
            chatRoom.type === 'group'
          );
        }
      } catch (notificationError) {
        console.error('Error sending message notifications:', notificationError);
        // Don't throw error as message was sent successfully
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send a meme message
  static async sendMemeMessage(
    chatId: string, 
    senderId: string, 
    senderName: string, 
    memeData: {
      memeId: string;
      title: string;
      imageUrl: string;
      authorName: string;
      publicId?: string;
    }
  ): Promise<ChatMessage> {
    try {
      const messageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const message: ChatMessage = {
        id: messageRef.id,
        chatId,
        senderId,
        senderName,
        text: `Shared a meme: ${memeData.title}`,
        type: 'meme',
        timestamp: Date.now(),
        memeData: {
          memeId: memeData.memeId,
          title: memeData.title,
          imageUrl: memeData.imageUrl,
          authorName: memeData.authorName,
          ...(memeData.publicId && { publicId: memeData.publicId }) // Only include if defined
        },
        readBy: [senderId]
      };

      console.log('Sending meme message with data:', message);

      const batch = writeBatch(db);

      // Add message
      batch.set(messageRef, message);
      
      // Update chat room last message and activity
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      batch.update(chatRef, {
        lastMessage: {
          text: `Shared a meme: ${memeData.title}`,
          senderId,
          timestamp: message.timestamp,
          type: 'meme'
        },
        lastActivity: message.timestamp
      });

      await batch.commit();

      // Send notifications to other participants (but not to sender)
      try {
        const chatRoom = await this.getChatRoom(chatId);
        if (chatRoom) {
          const otherParticipants = chatRoom.participants.filter(id => id !== senderId);

          for (const participantId of otherParticipants) {
            await NotificationService.createChatMessageNotification(
              participantId,
              senderId,
              senderName,
              chatId,
              chatRoom.name,
              chatRoom.type === 'group'
            );
          }
        }
      } catch (notificationError) {
        console.error('Error sending meme message notifications:', notificationError);
        // Don't throw error as message was sent successfully
      }

      return message;
    } catch (error) {
      console.error('Error sending meme message:', error);
      throw error;
    }
  }

  // Get chat messages
  static async getChatMessages(chatId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, this.CHAT_MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => doc.data() as ChatMessage)
        .reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Mark all messages in chat as read
  static async markChatAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.CHAT_MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        where('readBy', 'not-in', [[userId]])
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          readBy: arrayUnion(userId)
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  }

  // Get unread message count for user
  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      // Get user's chats
      const userChats = await this.getUserChats(userId);
      let totalUnread = 0;

      for (const chat of userChats) {
        const q = query(
          collection(db, this.CHAT_MESSAGES_COLLECTION),
          where('chatId', '==', chat.id),
          where('readBy', 'not-in', [[userId]])
        );

        const querySnapshot = await getDocs(q);

        // Filter out messages sent by the user
        const unreadMessages = querySnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.senderId !== userId;
        });

        totalUnread += unreadMessages.length;
      }

      return totalUnread;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  // Add participant to group chat
  static async addParticipant(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        participants: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  // Remove participant from group chat
  static async removeParticipant(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        participants: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  // Delete chat room
  static async deleteChatRoom(chatId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Mark chat as inactive instead of deleting
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      batch.update(chatRef, { isActive: false });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting chat room:', error);
      throw error;
    }
  }

  // Real-time listener for chat messages
  static subscribeToMessages(
    chatId: string, 
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.CHAT_MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);
      callback(messages);
    });
  }

  // Real-time listener for user's chats
  static subscribeToUserChats(
    userId: string,
    callback: (chats: ChatRoom[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.CHAT_ROOMS_COLLECTION),
      where('participants', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
      callback(chats);
    });
  }

  // Real-time listener for a specific chat
  static subscribeToChat(
    chatId: string,
    callback: (chat: ChatRoom | null) => void
  ): Unsubscribe {
    const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);

    return onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chat = {
          id: snapshot.id,
          ...snapshot.data()
        } as ChatRoom;
        callback(chat);
      } else {
        callback(null);
      }
    });
  }

  // Add participant to group chat
  static async addParticipantToGroup(
    chatId: string,
    adminId: string,
    newParticipantId: string
  ): Promise<void> {
    try {
      const chatRoom = await this.getChatRoom(chatId);
      if (!chatRoom || chatRoom.type !== 'group') {
        throw new Error('Group chat not found');
      }

      // Check if user is admin
      if (!chatRoom.admins?.includes(adminId)) {
        throw new Error('Only admins can add participants');
      }

      // All users can be added to group chat

      // Check if already a participant
      if (chatRoom.participants.includes(newParticipantId)) {
        throw new Error('User is already a participant');
      }

      const batch = writeBatch(db);

      // Add to participants
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      batch.update(chatRef, {
        participants: arrayUnion(newParticipantId),
        lastActivity: Date.now()
      });

      // Send system message
      const systemMessageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId,
        senderId: 'system',
        senderName: 'System',
        text: `User was added to the group`,
        type: 'system',
        timestamp: Date.now(),
        readBy: [adminId]
      };
      batch.set(systemMessageRef, systemMessage);

      await batch.commit();
    } catch (error) {
      console.error('Error adding participant to group:', error);
      throw error;
    }
  }

  // Remove participant from group chat
  static async removeParticipantFromGroup(
    chatId: string,
    adminId: string,
    participantId: string
  ): Promise<void> {
    try {
      const chatRoom = await this.getChatRoom(chatId);
      if (!chatRoom || chatRoom.type !== 'group') {
        throw new Error('Group chat not found');
      }

      // Check if user is admin or removing themselves
      if (!chatRoom.admins?.includes(adminId) && adminId !== participantId) {
        throw new Error('Only admins can remove participants');
      }

      // Cannot remove the creator unless they're leaving themselves
      if (participantId === chatRoom.createdBy && adminId !== participantId) {
        throw new Error('Cannot remove the group creator');
      }

      const batch = writeBatch(db);

      // Remove from participants
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      batch.update(chatRef, {
        participants: arrayRemove(participantId),
        admins: arrayRemove(participantId), // Also remove from admins if they were one
        lastActivity: Date.now()
      });

      // Send system message
      const systemMessageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId,
        senderId: 'system',
        senderName: 'System',
        text: adminId === participantId ? 'User left the group' : 'User was removed from the group',
        type: 'system',
        timestamp: Date.now(),
        readBy: [adminId]
      };
      batch.set(systemMessageRef, systemMessage);

      await batch.commit();
    } catch (error) {
      console.error('Error removing participant from group:', error);
      throw error;
    }
  }

  // Make user admin in group chat
  static async makeGroupAdmin(
    chatId: string,
    currentAdminId: string,
    newAdminId: string
  ): Promise<void> {
    try {
      const chatRoom = await this.getChatRoom(chatId);
      if (!chatRoom || chatRoom.type !== 'group') {
        throw new Error('Group chat not found');
      }

      // Check if user is admin
      if (!chatRoom.admins?.includes(currentAdminId)) {
        throw new Error('Only admins can promote other users');
      }

      // Check if target is participant
      if (!chatRoom.participants.includes(newAdminId)) {
        throw new Error('User is not a participant in this group');
      }

      // Check if already admin
      if (chatRoom.admins?.includes(newAdminId)) {
        throw new Error('User is already an admin');
      }

      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        admins: arrayUnion(newAdminId),
        lastActivity: Date.now()
      });

      // Send system message
      const systemMessageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId,
        senderId: 'system',
        senderName: 'System',
        text: 'User was promoted to admin',
        type: 'system',
        timestamp: Date.now(),
        readBy: [currentAdminId]
      };
      await setDoc(systemMessageRef, systemMessage);
    } catch (error) {
      console.error('Error making user admin:', error);
      throw error;
    }
  }

  // Send message to all followers
  static async sendMessageToFollowers(
    senderId: string,
    senderName: string,
    message: string,
    followerIds: string[]
  ): Promise<{ successCount: number; failedCount: number; chatIds: string[] }> {
    try {
      const results = {
        successCount: 0,
        failedCount: 0,
        chatIds: [] as string[]
      };

      // Process in batches to avoid overwhelming Firebase
      const batchSize = 10;
      for (let i = 0; i < followerIds.length; i += batchSize) {
        const batch = followerIds.slice(i, i + batchSize);

        const batchPromises = batch.map(async (followerId) => {
          try {
            // Create or get direct chat
            const chat = await this.createDirectChat(senderId, followerId);

            // Send message
            await this.sendMessage(chat.id, senderId, senderName, message);

            results.successCount++;
            results.chatIds.push(chat.id);
          } catch (error) {
            console.error(`Failed to send message to follower ${followerId}:`, error);
            results.failedCount++;
          }
        });

        await Promise.all(batchPromises);
      }

      return results;
    } catch (error) {
      console.error('Error sending message to followers:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.CHAT_MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        where('readBy', 'not-in', [[userId]])
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          readBy: arrayUnion(userId)
        });
      });

      if (querySnapshot.docs.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't throw error as this is not critical
    }
  }

  // Add emoji reaction to a message
  static async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data() as ChatMessage;
      const reactions = messageData.reactions || {};

      // Initialize emoji array if it doesn't exist
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }

      // Toggle reaction - add if not present, remove if present
      const userIndex = reactions[emoji].indexOf(userId);
      if (userIndex === -1) {
        reactions[emoji].push(userId);
      } else {
        reactions[emoji].splice(userIndex, 1);
        // Remove emoji key if no users left
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }

      await updateDoc(messageRef, { reactions });
    } catch (error) {
      console.error('Error adding message reaction:', error);
      throw error;
    }
  }

  // Remove emoji reaction from a message
  static async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data() as ChatMessage;
      const reactions = messageData.reactions || {};

      if (reactions[emoji]) {
        const userIndex = reactions[emoji].indexOf(userId);
        if (userIndex !== -1) {
          reactions[emoji].splice(userIndex, 1);
          // Remove emoji key if no users left
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
          await updateDoc(messageRef, { reactions });
        }
      }
    } catch (error) {
      console.error('Error removing message reaction:', error);
      throw error;
    }
  }

  // Add member to group
  static async addMemberToGroup(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data() as ChatRoom;

      if (chatData.type !== 'group') {
        throw new Error('Can only add members to group chats');
      }

      if (chatData.participants.includes(userId)) {
        throw new Error('Member already in group');
      }

      await updateDoc(chatRef, {
        participants: arrayUnion(userId),
        lastActivity: Date.now()
      });

      // Send notification to the added user
      try {
        await NotificationService.createGroupAddedNotification(
          userId,
          'system', // We don't have admin info here, could be improved
          'Admin',
          chatId,
          chatData.name || 'Group Chat'
        );
      } catch (notificationError) {
        console.error('Error sending group added notification:', notificationError);
        // Don't throw error as member was added successfully
      }

      // Note: Removed system message to avoid participant validation issues

    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  }

  // Remove member from group
  static async removeMemberFromGroup(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data() as ChatRoom;

      if (chatData.type !== 'group') {
        throw new Error('Can only remove members from group chats');
      }

      if (!chatData.participants.includes(userId)) {
        console.log('User not found in participants:', { userId, participants: chatData.participants });
        // If user is not in participants, they might have already been removed
        // Just return success to avoid errors
        return;
      }

      // Send system message first (before removing user)
      const systemMessageRef = doc(collection(db, this.CHAT_MESSAGES_COLLECTION));
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId,
        senderId: 'system',
        senderName: 'System',
        text: `User left the group`,
        type: 'system',
        timestamp: Date.now(),
        readBy: []
      };
      await setDoc(systemMessageRef, systemMessage);

      // Then remove user from participants
      await updateDoc(chatRef, {
        participants: arrayRemove(userId),
        admins: arrayRemove(userId), // Also remove from admins if they were one
        lastActivity: Date.now()
      });

    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  }

  // Update group settings
  static async updateGroupSettings(chatId: string, settings: { name?: string, avatar?: string, description?: string }): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data() as ChatRoom;

      if (chatData.type !== 'group') {
        throw new Error('Can only update settings for group chats');
      }

      const updateData: any = { lastActivity: Date.now() };

      if (settings.name) updateData.name = settings.name;
      if (settings.avatar !== undefined) updateData.avatar = settings.avatar;
      if (settings.description !== undefined) updateData.description = settings.description;

      await updateDoc(chatRef, updateData);

      // Note: Removed system message to avoid participant validation issues
      // The UI will show a success toast instead

    } catch (error) {
      console.error('Error updating group settings:', error);
      throw error;
    }
  }

  // Make user admin
  static async makeUserAdmin(chatId: string, currentAdminId: string, targetUserId: string): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data() as ChatRoom;

      if (chatData.type !== 'group') {
        throw new Error('Can only manage admins in group chats');
      }

      // Check if current user is admin
      if (!chatData.admins?.includes(currentAdminId)) {
        throw new Error('Only admins can promote members');
      }

      // Check if target user is already admin
      if (chatData.admins?.includes(targetUserId)) {
        throw new Error('User is already an admin');
      }

      // Check if target user is a participant
      if (!chatData.participants.includes(targetUserId)) {
        throw new Error('User is not a member of this group');
      }

      await updateDoc(chatRef, {
        admins: arrayUnion(targetUserId),
        lastActivity: Date.now()
      });

      // Send notification to the promoted user
      try {
        // Get admin name for notification
        const adminName = 'Admin'; // Could be improved to get actual admin name
        await NotificationService.createGroupAdminNotification(
          targetUserId,
          currentAdminId,
          adminName,
          chatId,
          chatData.name || 'Group Chat'
        );
      } catch (notificationError) {
        console.error('Error sending group admin notification:', notificationError);
        // Don't throw error as promotion was successful
      }

    } catch (error) {
      console.error('Error making user admin:', error);
      throw error;
    }
  }

  // Remove user admin status
  static async removeUserAdmin(chatId: string, currentAdminId: string, targetUserId: string): Promise<void> {
    try {
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data() as ChatRoom;

      if (chatData.type !== 'group') {
        throw new Error('Can only manage admins in group chats');
      }

      // Check if current user is admin
      if (!chatData.admins?.includes(currentAdminId)) {
        throw new Error('Only admins can remove admin status');
      }

      // Cannot remove creator's admin status
      if (targetUserId === chatData.createdBy) {
        throw new Error('Cannot remove admin status from group creator');
      }

      // Check if target user is actually an admin
      if (!chatData.admins?.includes(targetUserId)) {
        throw new Error('User is not an admin');
      }

      await updateDoc(chatRef, {
        admins: arrayRemove(targetUserId),
        lastActivity: Date.now()
      });

    } catch (error) {
      console.error('Error removing user admin status:', error);
      throw error;
    }
  }

  // Delete group
  static async deleteGroup(chatId: string): Promise<void> {
    try {
      // Delete all messages in the group
      const messagesQuery = query(
        collection(db, this.CHAT_MESSAGES_COLLECTION),
        where('chatId', '==', chatId)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);

      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the chat room
      const chatRef = doc(db, this.CHAT_ROOMS_COLLECTION, chatId);
      batch.delete(chatRef);

      await batch.commit();

    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }
}
