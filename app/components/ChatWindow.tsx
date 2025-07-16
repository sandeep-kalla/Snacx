"use client";

import { useState, useEffect, useRef } from "react";
import { ChatService, ChatRoom, ChatMessage } from "@/lib/chatService";
import { UserService, UserProfile } from "@/lib/userService";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import ChatMemeCard from "./ChatMemeCard";
import { getAvatarById } from "../../types/user";
import AvatarSelector from "./AvatarSelector";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

interface ChatWindowProps {
  chat: ChatRoom;
  onBack: () => void;
}

export default function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useUnreadMessages();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<{[userId: string]: UserProfile}>({});
  const [groupNameInput, setGroupNameInput] = useState(chat.name || "");
  const [groupAvatarInput, setGroupAvatarInput] = useState(chat.avatar || "👥");
  const [customGroupAvatarUrl, setCustomGroupAvatarUrl] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatDisplayName, setChatDisplayName] = useState(chat.name || "Chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Mark messages as read when opening chat
    if (user) {
      ChatService.markMessagesAsRead(chat.id, user.uid).then(() => {
        // Refresh unread count after marking as read with a small delay
        setTimeout(() => {
          refreshUnreadCount();
        }, 500);
      });
    }

    // Subscribe to real-time messages
    const unsubscribe = ChatService.subscribeToMessages(chat.id, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();

      // Mark new messages as read
      if (user) {
        ChatService.markMessagesAsRead(chat.id, user.uid).then(() => {
          // Refresh unread count after marking as read with a small delay
          setTimeout(() => {
            refreshUnreadCount();
          }, 500);
        });
      }
    });

    // Subscribe to chat updates for real-time header changes
    const chatUnsubscribe = ChatService.subscribeToChat(chat.id, (updatedChat) => {
      if (updatedChat) {
        // Update local chat data
        setChatDisplayName(updatedChat.name || "Group Chat");
        setGroupNameInput(updatedChat.name || "");
        setGroupAvatarInput(updatedChat.avatar || "👥");
      }
    });

    return () => {
      unsubscribe();
      chatUnsubscribe();
    };
  }, [chat.id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const chatMessages = await ChatService.getChatMessages(chat.id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const userProfile = await UserService.getUserProfile(user.uid);
      if (!userProfile) return;

      await ChatService.sendMessage(chat.id, user.uid, userProfile.nickname, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getChatDisplayName = async (): Promise<string> => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    } else {
      // For direct chats, show the other user's name
      const otherUserId = chat.participants.find(id => id !== user?.uid);
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

  useEffect(() => {
    getChatDisplayName().then(setChatDisplayName);
  }, [chat]);

  // Load member profiles for group chats
  useEffect(() => {
    if (chat.type === 'group' && chat.participants) {
      const loadMemberProfiles = async () => {
        console.log('Loading member profiles for participants:', chat.participants);
        const profiles: {[userId: string]: UserProfile} = {};
        for (const memberId of chat.participants) {
          try {
            const profile = await UserService.getUserProfile(memberId);
            if (profile) {
              profiles[memberId] = profile;
              console.log(`Loaded profile for ${memberId}:`, profile);
            } else {
              console.log(`No profile found for ${memberId}`);
            }
          } catch (error) {
            console.error(`Failed to load profile for ${memberId}:`, error);
          }
        }
        console.log('All member profiles loaded:', profiles);
        setMemberProfiles(profiles);
      };
      loadMemberProfiles();
    }
  }, [chat.participants, chat.type]);

  const handleGroupAvatarSelect = (avatarId: string, customUrl?: string) => {
    if (customUrl) {
      setCustomGroupAvatarUrl(customUrl);
      setGroupAvatarInput("custom");
    } else {
      setGroupAvatarInput(avatarId);
      setCustomGroupAvatarUrl("");
    }
  };

  const handleSaveGroupSettings = async () => {
    if (!user || chat.type !== 'group') return;

    try {
      setSavingSettings(true);

      // Use custom URL if available, otherwise use selected avatar ID
      const avatarToSave = customGroupAvatarUrl || groupAvatarInput;

      await ChatService.updateGroupSettings(chat.id, {
        name: groupNameInput.trim() || 'Group Chat',
        avatar: avatarToSave
      });
      toast.success('Group settings updated!');
      setShowGroupSettings(false);
    } catch (error) {
      console.error('Error updating group settings:', error);
      toast.error('Failed to update group settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user || chat.type !== 'group' || !chat.participants) return;

    // Only admins can remove members
    if (!chat.admins?.includes(user.uid)) {
      toast.error('Only admins can remove members');
      return;
    }

    try {
      await ChatService.removeMemberFromGroup(chat.id, memberId);
      toast.success('Member removed from group');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleMakeAdmin = async (memberId: string) => {
    if (!user || chat.type !== 'group') return;

    // Only admins can make other users admin
    if (!chat.admins?.includes(user.uid)) {
      toast.error('Only admins can promote members');
      return;
    }

    try {
      await ChatService.makeUserAdmin(chat.id, user.uid, memberId);
      toast.success('User promoted to admin');
    } catch (error) {
      console.error('Error making user admin:', error);
      toast.error('Failed to promote user');
    }
  };

  const handleRemoveAdmin = async (memberId: string) => {
    if (!user || chat.type !== 'group') return;

    // Only admins can remove admin status
    if (!chat.admins?.includes(user.uid)) {
      toast.error('Only admins can remove admin status');
      return;
    }

    try {
      await ChatService.removeUserAdmin(chat.id, user.uid, memberId);
      toast.success('Admin status removed');
    } catch (error) {
      console.error('Error removing admin status:', error);
      toast.error('Failed to remove admin status');
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || chat.type !== 'group') return;

    try {
      await ChatService.removeMemberFromGroup(chat.id, user.uid);
      toast.success('Left the group');
      onBack();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const loadAvailableUsers = async () => {
    if (!user) return;

    try {
      // Get all followed users
      const followedUsers = await UserService.getFollowedUsers(user.uid);
      // Filter out users who are already in the group
      const available = followedUsers.filter(u => !chat.participants.includes(u.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const handleAddMembers = async () => {
    if (!user || selectedNewMembers.length === 0) return;

    // Only admins can add members
    if (!chat.admins?.includes(user.uid)) {
      toast.error('Only admins can add members');
      return;
    }

    try {
      setSavingSettings(true);

      // Add each selected member
      const addedMembers = [];
      const alreadyMembers = [];
      
      for (const memberId of selectedNewMembers) {
        try {
          await ChatService.addMemberToGroup(chat.id, memberId);
          addedMembers.push(memberId);
        } catch (error: any) {
          if (error.message === 'Member already in group') {
            alreadyMembers.push(memberId);
          } else {
            throw error; // Re-throw other errors
          }
        }
      }

      // Show appropriate success/info messages
      if (addedMembers.length > 0) {
        toast.success(`Added ${addedMembers.length} member${addedMembers.length > 1 ? 's' : ''} to group`);
      }
      
      if (alreadyMembers.length > 0) {
        const memberNames = await Promise.all(
          alreadyMembers.map(async (id) => {
            try {
              const profile = await UserService.getUserProfile(id);
              return profile?.nickname || 'Unknown';
            } catch {
              return 'Unknown';
            }
          })
        );
        toast(`${memberNames.join(', ')} ${alreadyMembers.length > 1 ? 'are' : 'is'} already in the group`, {
          icon: 'ℹ️',
        });
      }

      setSelectedNewMembers([]);
      setShowAddMembers(false);

      // Reload member profiles
      const profiles: {[userId: string]: UserProfile} = {};
      for (const memberId of [...chat.participants, ...selectedNewMembers]) {
        try {
          const profile = await UserService.getUserProfile(memberId);
          if (profile) {
            profiles[memberId] = profile;
          }
        } catch (error) {
          console.error(`Failed to load profile for ${memberId}:`, error);
        }
      }
      setMemberProfiles(profiles);

    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add members');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedNewMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30">
                {chat.type === 'group' ? (
                  chat.avatar?.startsWith('http') ? (
                    <img
                      src={chat.avatar}
                      alt="Group avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">
                      {(() => {
                        const avatar = getAvatarById(chat.avatar || '👥');
                        return avatar?.url || '👥';
                      })()}
                    </span>
                  )
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-foreground">{chatDisplayName}</h2>
                <p className="text-sm text-text-secondary">
                  {chat.type === 'group' ? `${chat.participants.length} participants` : 'Direct chat'}
                </p>
              </div>
            </div>
          </div>

          {/* Group Settings Button */}
          {chat.type === 'group' && (
            <button
              onClick={() => setShowGroupSettings(!showGroupSettings)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Group Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.uid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {message.senderId !== user?.uid && (
                  <p className="text-xs opacity-70 mb-1">{message.senderName}</p>
                )}

                {message.type === 'meme' && message.memeData ? (
                  <ChatMemeCard
                    memeId={message.memeData.memeId}
                    title={message.memeData.title}
                    imageUrl={message.memeData.imageUrl}
                    authorName={message.memeData.authorName}
                    publicId={message.memeData.publicId}
                  />
                ) : (
                  <p>{message.text}</p>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">No messages yet</p>
            <p className="text-sm text-text-secondary mt-1">Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {sendingMessage ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Group Settings Panel */}
      {showGroupSettings && chat.type === 'group' && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col">
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Group Settings</h2>
              <button
                onClick={() => setShowGroupSettings(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-8">
              {/* Group Preview */}
              <div className="bg-card/90 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center overflow-hidden">
                    {groupAvatarInput?.startsWith('http') ? (
                      <img
                        src={groupAvatarInput}
                        alt="Group avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">
                        {(() => {
                          const avatarId = groupAvatarInput || chat.avatar || '👥';
                          const avatar = getAvatarById(avatarId);
                          return avatar?.url || '👥';
                        })()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">
                      {groupNameInput || chat.name || 'Group Name'}
                    </h4>
                    <p className="text-text-secondary">
                      {chat.participants?.length || 0} members
                    </p>
                  </div>
                </div>
              </div>

              {/* Group Name */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Group Name</h3>
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Choose Avatar */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Choose Avatar</h3>
                <AvatarSelector
                  selectedAvatarId={groupAvatarInput}
                  onAvatarSelect={handleGroupAvatarSelect}
                  className="w-full"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleSaveGroupSettings}
                  disabled={savingSettings}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {savingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Group Members */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Group Members ({chat.participants?.length || 0})</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto bg-card/50 rounded-lg p-4 border border-border/50">
                  {chat.participants?.map(memberId => {
                    const memberProfile = memberProfiles[memberId];
                    const isCurrentUser = memberId === user?.uid;
                    const isCreator = memberId === chat.createdBy;
                    const isAdmin = chat.admins?.includes(memberId);
                    const currentUserIsAdmin = chat.admins?.includes(user?.uid || '');
                    const displayName = isCurrentUser ? 'You' : (memberProfile?.nickname || 'Loading...');

                    return (
                      <div key={memberId} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm overflow-hidden border-2 border-primary/20">
                            {memberProfile?.avatar ? (
                              memberProfile.avatar.startsWith('http') ? (
                                <img
                                  src={memberProfile.avatar}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm">
                                  {getAvatarById(memberProfile.avatar)?.url || '👤'}
                                </span>
                              )
                            ) : '👤'}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{displayName}</span>
                            {isCreator && (
                              <span className="text-sm text-primary block font-medium">Creator</span>
                            )}
                            {isAdmin && !isCreator && (
                              <span className="text-sm text-accent block font-medium">Admin</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Make Admin Button - only show if current user is admin and target is not admin/creator */}
                          {currentUserIsAdmin && !isCurrentUser && !isAdmin && !isCreator && (
                            <button
                              onClick={() => handleMakeAdmin(memberId)}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                            >
                              Make Admin
                            </button>
                          )}
                          {/* Remove Admin Button - only show if current user is admin and target is admin but not creator */}
                          {currentUserIsAdmin && !isCurrentUser && isAdmin && !isCreator && (
                            <button
                              onClick={() => handleRemoveAdmin(memberId)}
                              className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition-colors"
                            >
                              Remove Admin
                            </button>
                          )}
                          {/* Remove Member Button - only show if current user is admin and target is not creator */}
                          {currentUserIsAdmin && !isCurrentUser && !isCreator && (
                            <button
                              onClick={() => handleRemoveMember(memberId)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Only show Add Members button for admins */}
                {chat.admins?.includes(user?.uid || '') && (
                  <button
                    onClick={() => {
                      setSelectedNewMembers([]);
                      setSearchQuery("");
                      setShowAddMembers(true);
                      loadAvailableUsers();
                    }}
                    className="w-full p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center space-x-2 text-primary border border-primary/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="font-medium">Add Members</span>
                  </button>
                )}
              </div>

              {/* Leave Group */}
              <div className="pt-6 border-t border-border/50">
                <button
                  onClick={handleLeaveGroup}
                  className="w-full p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center space-x-2 text-red-500 border border-red-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Leave Group</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 flex flex-col">
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Add Members</h2>
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                  setSearchQuery("");
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search followers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Available Users */}
            <div className="space-y-2">
              {availableUsers
                .filter(user =>
                  user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user) => {
                  const isSelected = selectedNewMembers.includes(user.uid);
                  return (
                    <div
                      key={user.uid}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMemberSelection(user.uid);
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'hover:bg-secondary border-2 border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        {user.avatar ? getAvatarById(user.avatar)?.url || '👤' : '👤'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{user.nickname}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}

              {availableUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No followers available to add</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Button */}
          {selectedNewMembers.length > 0 && (
            <div className="p-4 border-t border-border">
              <button
                onClick={handleAddMembers}
                disabled={savingSettings}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {savingSettings ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </div>
                ) : (
                  `Add ${selectedNewMembers.length} member${selectedNewMembers.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
