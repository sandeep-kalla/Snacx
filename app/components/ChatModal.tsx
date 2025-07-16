"use client";

import { useState, useEffect, useRef } from "react";
import { ChatService, ChatRoom, ChatMessage } from "@/lib/chatService";
import { FollowService } from "@/lib/followService";
import { UserService, UserProfile } from "@/lib/userService";
import { InteractionSortingService } from "@/lib/interactionSortingService";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ChatMemeCard from "./ChatMemeCard";
import { getAvatarById } from "../../types/user";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  memeData?: {
    id: string;
    title: string;
    imageUrl: string;
    authorName: string;
    publicId?: string;
  };
}

export default function ChatModal({ isOpen, onClose, memeData }: ChatModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'chat'>('select');
  const [followedUsers, setFollowedUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [existingChats, setExistingChats] = useState<ChatRoom[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      console.log('ChatModal opened, loading data for user:', user.uid);
      loadFollowedUsers();
      loadExistingChats();
    } else if (isOpen && !user) {
      console.log('ChatModal opened but no user found');
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (currentChat) {
      loadMessages();
      
      // Subscribe to real-time messages
      const unsubscribe = ChatService.subscribeToMessages(currentChat.id, (newMessages) => {
        setMessages(newMessages);
        scrollToBottom();
      });
      
      return () => unsubscribe();
    }
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFollowedUsers = async () => {
    if (!user) {
      console.log('No user found in loadFollowedUsers');
      return;
    }

    try {
      console.log('Loading followed users for user:', user.uid);
      setLoading(true);
      const users = await FollowService.getFollowing(user.uid);
      console.log('Followed user IDs:', users.map(u => u.followingId));
      
      // Get user profiles
      const profiles = await Promise.all(
        users.map(follow => UserService.getUserProfile(follow.followingId))
      );
      
      const validProfiles = profiles.filter(profile => profile !== null) as UserProfile[];
      console.log('Valid user profiles:', validProfiles.length);
      
      // Sort by interaction level
      const sortedUsers = await InteractionSortingService.sortUsersByInteraction(
        user.uid, 
        validProfiles
      );
      
      console.log('Final sorted users:', sortedUsers.length);
      setFollowedUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading followed users:', error);
      setFollowedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingChats = async () => {
    if (!user) return;

    try {
      console.log('Getting chats for user:', user.uid);
      const chats = await ChatService.getUserChats(user.uid);

      // Sort by last activity
      const sortedChats = chats.sort((a, b) => {
        const timeA = a.lastActivity || a.createdAt || 0;
        const timeB = b.lastActivity || b.createdAt || 0;
        return timeB - timeA;
      });

      setExistingChats(sortedChats);
    } catch (error) {
      console.error('Error loading existing chats:', error);
      setExistingChats([]);
    }
  };

  const loadMessages = async () => {
    if (!currentChat) return;

    try {
      const chatMessages = await ChatService.getChatMessages(currentChat.id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    console.log('User selected:', userId, 'isGroup:', isGroup);
    if (isGroup) {
      setSelectedUsers(prev => {
        const newSelection = prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId];
        console.log('New selection:', newSelection);
        return newSelection;
      });
    } else {
      setSelectedUsers([userId]);
      console.log('Direct chat selected with:', userId);
    }
  };

  const handleStartChat = async () => {
    console.log('handleStartChat called', { user: user?.uid, selectedUsers, isGroup, groupName });
    if (!user || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      let chat: ChatRoom;

      if (isGroup) {
        if (!groupName.trim()) {
          toast.error('Please enter a group name');
          return;
        }
        chat = await ChatService.createGroupChat(user.uid, selectedUsers, groupName.trim());
      } else {
        chat = await ChatService.createDirectChat(user.uid, selectedUsers[0]);
      }

      setCurrentChat(chat);
      setStep('chat');
      
      // Send meme if provided
      if (memeData) {
        await sendMeme();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMeme = async () => {
    if (!user || !currentChat || !memeData) return;

    try {
      console.log('Sending meme:', memeData);
      const userProfile = await UserService.getUserProfile(user.uid);
      const userName = userProfile?.nickname || user.displayName || 'Anonymous';

      await ChatService.sendMemeMessage(currentChat.id, user.uid, userName, {
        memeId: memeData.id,
        title: memeData.title,
        imageUrl: memeData.imageUrl,
        authorName: memeData.authorName,
        publicId: memeData.publicId
      });
      
      console.log('Meme sent successfully');
      toast.success('Meme shared!');
      
      // Refresh messages to show the new meme
      await loadMessages();
    } catch (error) {
      console.error('Error sending meme:', error);
      toast.error('Failed to share meme');
    }
  };

  const sendMessage = async () => {
    if (!user || !currentChat || !newMessage.trim()) return;

    try {
      const userProfile = await UserService.getUserProfile(user.uid);
      const userName = userProfile?.nickname || user.displayName || 'Anonymous';

      await ChatService.sendMessage(currentChat.id, user.uid, userName, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedUsers([]);
    setGroupName('');
    setIsGroup(false);
    setCurrentChat(null);
    setMessages([]);
    setNewMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0"
        onClick={handleClose}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col relative z-10"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {step === 'select' ? 'Share Meme' : currentChat?.name || 'Chat'}
              {loading && <span className="text-sm ml-2">(Loading...)</span>}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'select' ? (
            <div className="space-y-6">
              {/* Existing Chats */}
              {existingChats.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Recent Chats</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {existingChats.slice(0, 5).map((chat) => (
                      <button
                        key={chat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentChat(chat);
                          setStep('chat');
                          if (memeData) {
                            sendMeme();
                          }
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors border border-border"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {chat.type === 'group' ? '👥' : '👤'}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{chat.name}</h4>
                            <p className="text-sm text-text-secondary">
                              {chat.type === 'group' ? `${chat.participants.length} members` : 'Direct chat'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Type Selection */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Start New Chat</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGroup(false);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      !isGroup ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}
                  >
                    Direct Message
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGroup(true);
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isGroup ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}
                  >
                    Group Chat
                  </button>
                </div>
              </div>

              {/* Group Name Input */}
              {isGroup && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {/* User Selection */}
              <div>
                <div className="mb-2 text-sm text-muted-foreground px-2 flex items-center gap-2">
                  <span>Select users to share with: ({followedUsers.length} available)</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    📊 Sorted by interaction
                  </span>
                </div>

                {followedUsers.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                    {followedUsers.map((userProfile) => (
                      <div
                        key={userProfile.uid}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('User clicked:', userProfile.nickname, userProfile.uid);
                          handleUserSelect(userProfile.uid);
                        }}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          selectedUsers.includes(userProfile.uid)
                            ? 'bg-primary/20 border-primary border-2 shadow-md'
                            : 'bg-background hover:bg-secondary border-border hover:border-primary/50 border'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                          {userProfile.avatar.startsWith('http') ? (
                            <img
                              src={userProfile.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">
                              {getAvatarById(userProfile.avatar)?.url || '🐱'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{userProfile.nickname}</h4>
                          <p className="text-sm text-text-secondary">
                            {userProfile.bio || 'No bio available'}
                          </p>
                        </div>
                        {selectedUsers.includes(userProfile.uid) && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">No followed users found</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Follow some users to start chatting with them
                    </p>
                  </div>
                )}
              </div>

              {/* Start Chat Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartChat();
                }}
                disabled={selectedUsers.length === 0 || loading || (isGroup && !groupName.trim())}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting Chat...' : `Start ${isGroup ? 'Group ' : ''}Chat`}
              </button>
            </div>
          ) : (
            /* Chat View */
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
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
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
