"use client";

import { useState, useEffect } from "react";
import { ChatService, ChatRoom } from "@/lib/chatService";
import { UserService, UserProfile } from "@/lib/userService";
import { FollowService } from "@/lib/followService";
import { InteractionSortingService } from "@/lib/interactionSortingService";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { getAvatarById } from "../../types/user";

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect: (chat: ChatRoom) => void;
  onNewGroup: () => void;
}

export default function ChatSidebar({ selectedChatId, onChatSelect, onNewGroup }: ChatSidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [chatDisplayNames, setChatDisplayNames] = useState<{[chatId: string]: string}>({});
  const [chatAvatars, setChatAvatars] = useState<{[chatId: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'groups'>('all');
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (user) {
      loadChats();
      loadFollowers();

      // Set up real-time listener for chat changes
      const unsubscribe = ChatService.subscribeToUserChats(user.uid, (updatedChats) => {
        setChats(updatedChats);
        // Reload display names and avatars for new chats
        loadChatDisplayData(updatedChats);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const loadChatDisplayData = async (chatList: ChatRoom[]) => {
    if (!user) return;

    try {
      // Load display names and avatars for chats
      const chatDataPromises = chatList.map(async (chat) => {
        const displayName = await getChatDisplayName(chat, user.uid);
        const avatar = await getChatAvatar(chat, user.uid);
        return { chatId: chat.id, displayName, avatar };
      });

      const results = await Promise.all(chatDataPromises);
      const namesMap = results.reduce((acc, { chatId, displayName }) => {
        acc[chatId] = displayName;
        return acc;
      }, {} as {[chatId: string]: string});

      const avatarsMap = results.reduce((acc, { chatId, avatar }) => {
        acc[chatId] = avatar;
        return acc;
      }, {} as {[chatId: string]: string});

      setChatDisplayNames(namesMap);
      setChatAvatars(avatarsMap);
    } catch (error) {
      console.error('Error loading chat display data:', error);
    }
  };

  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userChats = await ChatService.getUserChats(user.uid);
      setChats(userChats);
      await loadChatDisplayData(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowers = async () => {
    if (!user) return;

    try {
      const users = await FollowService.getFollowing(user.uid);

      // Get user profiles
      const profiles = await Promise.all(
        users.map(follow => UserService.getUserProfile(follow.followingId))
      );

      const validProfiles = profiles.filter(profile => profile !== null) as UserProfile[];

      // Sort by interaction level
      const sortedUsers = await InteractionSortingService.sortUsersByInteraction(
        user.uid,
        validProfiles
      );

      setFollowers(sortedUsers);
    } catch (error) {
      console.error('Error loading followers:', error);
    }
  };

  const getChatDisplayName = async (chat: ChatRoom, currentUserId: string): Promise<string> => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    } else {
      // For direct chats, show the other user's name
      const otherUserId = chat.participants.find(id => id !== currentUserId);
      if (otherUserId) {
        try {
          const userProfile = await UserService.getUserProfile(otherUserId);
          return userProfile?.nickname || 'Unknown User';
        } catch (error) {
          return 'Unknown User';
        }
      }
      return 'Direct Chat';
    }
  };

  const getChatAvatar = async (chat: ChatRoom, currentUserId: string): Promise<string> => {
    if (chat.type === 'group') {
      // For groups, process avatar through getAvatarById if it's not a URL
      if (chat.avatar) {
        if (chat.avatar.startsWith('http')) {
          return chat.avatar; // Custom image URL
        } else {
          // Avatar ID - get the emoji
          const avatar = getAvatarById(chat.avatar);
          return avatar?.url || '👥';
        }
      }
      return '👥'; // Default group icon
    } else {
      // For direct chats, show the other user's avatar
      const otherUserId = chat.participants.find(id => id !== currentUserId);
      if (otherUserId) {
        try {
          const userProfile = await UserService.getUserProfile(otherUserId);
          if (userProfile?.avatar) {
            if (userProfile.avatar.startsWith('http')) {
              return userProfile.avatar;
            } else {
              return getAvatarById(userProfile.avatar)?.url || '👤';
            }
          }
          return '👤';
        } catch (error) {
          return '👤';
        }
      }
      return '👤';
    }
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    if (!user) return;

    try {
      // Check if a direct chat already exists
      const existingChat = chats.find(chat =>
        chat.type === 'direct' &&
        chat.participants.includes(targetUserId) &&
        chat.participants.includes(user.uid)
      );

      if (existingChat) {
        // Select existing chat
        onChatSelect(existingChat);
      } else {
        // Create new direct chat and immediately open it
        const newChat = await ChatService.createDirectChat(user.uid, targetUserId);

        // Immediately select the new chat
        onChatSelect(newChat);

        // Reload chats in background to update the sidebar
        setTimeout(() => {
          loadChats();
        }, 100);
      }
    } catch (error) {
      console.error('Error starting direct chat:', error);
    }
  };

  const filteredChats = chats.filter(chat => {
    if (activeTab === 'personal') return chat.type === 'direct';
    if (activeTab === 'groups') return chat.type === 'group';
    return true; // 'all'
  });

  const personalChats = chats.filter(chat => chat.type === 'direct');
  const groupChats = chats.filter(chat => chat.type === 'group');

  // Count followers that don't have existing chats
  const followersWithoutChats = followers.filter(follower =>
    !chats.some(chat =>
      chat.type === 'direct' &&
      chat.participants.includes(follower.uid)
    )
  );

  const totalConversations = chats.length + followersWithoutChats.length;

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <button
            onClick={onNewGroup}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            title="New Group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
            }`}
          >
            All ({totalConversations})
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'personal' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
            }`}
          >
            Personal ({personalChats.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'groups' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
            }`}
          >
            Groups ({groupChats.length})
          </button>
        </div>
      </div>



      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (filteredChats.length > 0 || followers.length > 0) ? (
          <div className="space-y-1 px-4">
            {/* Existing Chats */}
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedChatId === chat.id 
                    ? 'bg-primary/20 border-primary border' 
                    : 'hover:bg-secondary'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {chatAvatars[chat.id] ? (
                      chatAvatars[chat.id].startsWith('http') ? (
                        <img
                          src={chatAvatars[chat.id]}
                          alt="Chat Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {(() => {
                            const avatarId = chatAvatars[chat.id];
                            if (chat.type === 'group') {
                              // For group avatars, process through getAvatarById
                              const avatar = getAvatarById(avatarId);
                              return avatar?.url || '👥';
                            }
                            // For direct chats, it's already processed
                            return avatarId || '👤';
                          })()}
                        </span>
                      )
                    ) : chat.type === 'group' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {chatDisplayNames[chat.id] || chat.name || 'Chat'}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {chat.type === 'group' ? `${chat.participants.length} participants` : 'Direct chat'}
                    </p>
                  </div>
                  {chat.lastActivity && (
                    <span className="text-xs text-text-secondary">
                      {formatDistanceToNow(new Date(chat.lastActivity), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </button>
            ))}

            {/* Followers as Chat Items */}
            {followers.map((follower) => {
              // Check if we already have a chat with this follower
              const existingChat = filteredChats.find(chat =>
                chat.type === 'direct' &&
                chat.participants.includes(follower.uid)
              );

              // Only show follower if no existing chat
              if (existingChat) return null;

              return (
                <button
                  key={`follower-${follower.uid}`}
                  onClick={() => handleStartDirectChat(follower.uid)}
                  className="w-full text-left p-3 rounded-lg transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {follower.avatar.startsWith('http') ? (
                        <img
                          src={follower.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {getAvatarById(follower.avatar)?.url || '🐱'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {follower.nickname}
                      </h3>
                      <p className="text-sm text-text-secondary truncate">
                        {follower.bio || 'No bio available'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-text-secondary">No chats or followers found</p>
            <button
              onClick={onNewGroup}
              className="mt-2 text-primary hover:underline"
            >
              Create a group
            </button>
          </div>
        )}
      </div>


    </div>
  );
}
