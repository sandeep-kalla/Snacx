"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatService, ChatRoom, ChatMessage } from "@/lib/chatService";
import { UserService } from "@/lib/userService";
import { FollowService } from "@/lib/followService";
import { InteractionSortingService } from "@/lib/interactionSortingService";
import { UserProfile, getAvatarById } from "../../types/user";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

// Helper function to get chat display name
const getChatDisplayName = async (chat: ChatRoom, currentUserId: string): Promise<string> => {
  if (chat.type === 'group') {
    return chat.name || `Group Chat`;
  } else {
    // For direct chats, show the other participant's name
    const otherParticipantId = chat.participants.find(p => p !== currentUserId);
    if (otherParticipantId) {
      try {
        const otherUser = await UserService.getUserProfile(otherParticipantId);
        return otherUser?.nickname || 'Unknown User';
      } catch (error) {
        console.error('Error getting user profile:', error);
        return 'Direct Chat';
      }
    }
    return 'Direct Chat';
  }
};

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialChatId?: string;
}

export default function ChatInterface({ isOpen, onClose, initialChatId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'chat' | 'followers' | 'createGroup'>('list');
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [followerMessage, setFollowerMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [chatFilter, setChatFilter] = useState<'all' | 'personal' | 'groups'>('all');
  const [chatDisplayNames, setChatDisplayNames] = useState<{[chatId: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's chats
  useEffect(() => {
    if (!user || !isOpen) return;

    const unsubscribe = ChatService.subscribeToUserChats(user.uid, (userChats) => {
      setChats(userChats);
    });

    return unsubscribe;
  }, [user, isOpen]);

  // Load initial chat if provided
  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === initialChatId);
      if (chat) {
        handleSelectChat(chat);
      }
    }
  }, [initialChatId, chats]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat display names
  useEffect(() => {
    const loadChatNames = async () => {
      if (!user || chats.length === 0) return;

      const namePromises = chats.map(async (chat) => {
        const displayName = await getChatDisplayName(chat, user.uid);
        return { chatId: chat.id, displayName };
      });

      const results = await Promise.all(namePromises);
      const namesMap = results.reduce((acc, { chatId, displayName }) => {
        acc[chatId] = displayName;
        return acc;
      }, {} as {[chatId: string]: string});

      setChatDisplayNames(namesMap);
    };

    loadChatNames();
  }, [chats, user]);

  // Load followers for messaging (sorted by interaction)
  const loadFollowers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userFollowers = await FollowService.getFollowers(user.uid);
      const followerProfiles = await Promise.all(
        userFollowers.map(follow => UserService.getUserProfile(follow.followerId))
      );
      const validProfiles = followerProfiles.filter(Boolean) as UserProfile[];

      // Sort by interaction level
      const sortedFollowers = await InteractionSortingService.sortUsersByInteraction(
        user.uid,
        validProfiles
      );

      setFollowers(sortedFollowers);
    } catch (error) {
      console.error('Error loading followers:', error);
      toast.error('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  // Load all users for group creation (sorted by interaction)
  const loadAllUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get followers and following
      const [userFollowers, userFollowing] = await Promise.all([
        FollowService.getFollowers(user.uid),
        FollowService.getFollowing(user.uid)
      ]);

      // Combine and deduplicate
      const allUserIds = new Set([
        ...userFollowers.map(f => f.followerId),
        ...userFollowing.map(f => f.followingId)
      ]);

      const userProfiles = await Promise.all(
        Array.from(allUserIds).map(id => UserService.getUserProfile(id))
      );

      const validProfiles = userProfiles.filter(Boolean) as UserProfile[];

      // Sort by interaction level
      const sortedUsers = await InteractionSortingService.sortUsersByInteraction(
        user.uid,
        validProfiles
      );

      setAllUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat: ChatRoom) => {
    setSelectedChat(chat);
    setView('chat');
    
    try {
      setLoading(true);
      const chatMessages = await ChatService.getChatMessages(chat.id);
      setMessages(chatMessages);
      
      // Mark messages as read
      if (chatMessages.length > 0) {
        await ChatService.markMessagesAsRead(chat.id, user!.uid);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const userProfile = await UserService.getUserProfile(user.uid);
      if (!userProfile) return;

      await ChatService.sendMessage(
        selectedChat.id,
        user.uid,
        userProfile.nickname,
        newMessage.trim()
      );
      
      setNewMessage("");
      
      // Reload messages
      const updatedMessages = await ChatService.getChatMessages(selectedChat.id);
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendToFollowers = async () => {
    if (!followerMessage.trim() || selectedFollowers.length === 0 || !user) return;

    try {
      setLoading(true);
      const userProfile = await UserService.getUserProfile(user.uid);
      if (!userProfile) return;

      const result = await ChatService.sendMessageToFollowers(
        user.uid,
        userProfile.nickname,
        followerMessage.trim(),
        selectedFollowers
      );

      toast.success(`Message sent to ${result.successCount} followers`);
      if (result.failedCount > 0) {
        toast.error(`Failed to send to ${result.failedCount} followers`);
      }

      setFollowerMessage("");
      setSelectedFollowers([]);
      setView('list');
    } catch (error) {
      console.error('Error sending to followers:', error);
      toast.error('Failed to send messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedMembers.length === 0) {
      toast.error('Please enter group name and select members');
      return;
    }

    try {
      setLoading(true);
      const userProfile = await UserService.getUserProfile(user.uid);
      if (!userProfile) return;

      const group = await ChatService.createGroupChat(
        user.uid,
        selectedMembers,
        groupName.trim(),
        groupDescription.trim() || undefined
      );

      toast.success('Group created successfully!');
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      setView('list');

      // Select the new group
      handleSelectChat(group);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort chats
  const filteredChats = chats
    .filter(chat => {
      // Filter by search term
      const displayName = chatDisplayNames[chat.id] || chat.name || '';
      const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.participants.some(p => p.includes(searchTerm.toLowerCase()));

      // Filter by type
      if (chatFilter === 'personal') return chat.type === 'direct' && matchesSearch;
      if (chatFilter === 'groups') return chat.type === 'group' && matchesSearch;
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by last activity (most recent first)
      return b.lastActivity - a.lastActivity;
    });

  const personalChats = chats.filter(chat => chat.type === 'direct');
  const groupChats = chats.filter(chat => chat.type === 'group');

  const filteredFollowers = followers.filter(follower =>
    follower.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(user =>
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex"
        >
          {/* Sidebar */}
          <div className="w-1/3 border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Messages</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setView('createGroup');
                      loadAllUsers();
                    }}
                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    title="Create Group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-3"
              />

              {/* Chat Filter Tabs */}
              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => setChatFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    chatFilter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  All ({chats.length})
                </button>
                <button
                  onClick={() => setChatFilter('personal')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    chatFilter === 'personal'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Personal ({personalChats.length})
                </button>
                <button
                  onClick={() => setChatFilter('groups')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    chatFilter === 'groups'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Groups ({groupChats.length})
                </button>
              </div>

              {/* Message Followers Button */}
              <button
                onClick={() => {
                  setView('followers');
                  loadFollowers();
                }}
                className="w-full px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90"
              >
                Message Followers
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {view === 'list' && (
                <div className="p-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className="p-3 hover:bg-accent/50 rounded-lg cursor-pointer border-b border-border/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {chat.type === 'group' ? '👥' : '💬'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {chatDisplayNames[chat.id] || chat.name || `Chat ${chat.id.slice(0, 8)}`}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage?.text || 'No messages yet'}
                          </p>
                        </div>
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredChats.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No chats found</p>
                      <p className="text-sm mt-2">Start a new conversation!</p>
                    </div>
                  )}
                </div>
              )}
              
              {view === 'createGroup' && (
                <div className="p-2">
                  <div className="mb-4 p-3 bg-accent/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setView('list')}
                        className="p-1 hover:bg-accent/50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="font-medium">Create New Group</h3>
                    </div>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-2"
                    />
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Group description (optional)..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none mb-2"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMembers(allUsers.map(u => u.uid))}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedMembers([])}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleCreateGroup}
                        disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                      >
                        Create ({selectedMembers.length})
                      </button>
                    </div>
                  </div>

                  {/* Member selection list */}
                  <div className="mb-2 text-sm text-muted-foreground px-2 flex items-center gap-2">
                    <span>Select users to add to the group:</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      📊 Sorted by interaction
                    </span>
                  </div>
                  {filteredAllUsers.map((selectedUser) => (
                    <div
                      key={selectedUser.uid}
                      onClick={() => {
                        if (selectedMembers.includes(selectedUser.uid)) {
                          setSelectedMembers(prev => prev.filter(id => id !== selectedUser.uid));
                        } else {
                          setSelectedMembers(prev => [...prev, selectedUser.uid]);
                        }
                      }}
                      className={`p-3 hover:bg-accent/50 rounded-lg cursor-pointer border-b border-border/50 ${
                        selectedMembers.includes(selectedUser.uid) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {selectedUser.avatar.startsWith('http') ? (
                            <img src={selectedUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">{getAvatarById(selectedUser.avatar)?.url || '🐱'}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{selectedUser.nickname}</p>
                          <p className="text-xs text-muted-foreground">
                            {followers.some(f => f.uid === selectedUser.uid) ? 'Follower' : 'Following'}
                          </p>
                        </div>
                        {selectedMembers.includes(selectedUser.uid) && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'followers' && (
                <div className="p-2">
                  <div className="mb-4 p-3 bg-accent/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setView('list')}
                        className="p-1 hover:bg-accent/50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="font-medium">Message All Followers</h3>
                    </div>
                    <textarea
                      value={followerMessage}
                      onChange={(e) => setFollowerMessage(e.target.value)}
                      placeholder="Type your message to followers..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setSelectedFollowers(followers.map(f => f.uid))}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedFollowers([])}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleSendToFollowers}
                        disabled={selectedFollowers.length === 0 || !followerMessage.trim() || loading}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                      >
                        Send ({selectedFollowers.length})
                      </button>
                    </div>
                  </div>

                  {/* Followers list header */}
                  <div className="mb-2 text-sm text-muted-foreground px-2 flex items-center gap-2">
                    <span>Your followers:</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      📊 Sorted by interaction
                    </span>
                  </div>

                  {filteredFollowers.map((follower) => (
                    <div
                      key={follower.uid}
                      onClick={() => {
                        if (selectedFollowers.includes(follower.uid)) {
                          setSelectedFollowers(prev => prev.filter(id => id !== follower.uid));
                        } else {
                          setSelectedFollowers(prev => [...prev, follower.uid]);
                        }
                      }}
                      className={`p-3 hover:bg-accent/50 rounded-lg cursor-pointer border-b border-border/50 ${
                        selectedFollowers.includes(follower.uid) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {follower.avatar.startsWith('http') ? (
                            <img src={follower.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">{getAvatarById(follower.avatar)?.url || '🐱'}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{follower.nickname}</p>
                        </div>
                        {selectedFollowers.includes(follower.uid) && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {view === 'chat' && selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setView('list')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ←
                      </button>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {selectedChat.type === 'group' ? '👥' : '💬'}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {chatDisplayNames[selectedChat.id] || selectedChat.name || `Chat ${selectedChat.id.slice(0, 8)}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedChat.participants.length} participants
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.uid
                            ? 'bg-primary text-primary-foreground'
                            : message.type === 'system'
                            ? 'bg-muted text-muted-foreground text-center'
                            : 'bg-accent text-accent-foreground'
                        }`}
                      >
                        {message.type !== 'system' && message.senderId !== user?.uid && (
                          <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
                        )}
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
                  <p className="text-sm">Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
