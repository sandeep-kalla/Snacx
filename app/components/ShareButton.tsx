"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { UserService, UserProfile } from "@/lib/userService";
import { ChatService, ChatRoom } from "@/lib/chatService";
import { getAvatarById } from "../../types/user";

interface ShareButtonProps {
  memeId: string;
  memeTitle: string;
  memeImageUrl: string;
  authorName: string;
  className?: string;
}

interface SharePlatform {
  name: string;
  icon: string;
  color: string;
  action: () => void;
}

export default function ShareButton({
  memeId,
  memeTitle,
  memeImageUrl,
  authorName,
  className = ""
}: ShareButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showInstagramOptions, setShowInstagramOptions] = useState(false);
  const [showChatShare, setShowChatShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<UserProfile[]>([]);
  const [userGroups, setUserGroups] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sendingToChat, setSendingToChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'groups'>('followers');

  // Generate share URL and text
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/meme/${memeId}` : `/meme/${memeId}`;
  const shareText = `Check out this hilarious meme "${memeTitle}" by ${authorName} on Snacx! 😂`;
  const hashtags = "memes,funny,Snacx";

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Link copied to clipboard! 📋");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // Download meme
  const downloadMeme = async () => {
    try {
      setIsSharing(true);
      const response = await fetch(memeImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${memeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meme.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Meme downloaded! 📥");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to download meme");
    } finally {
      setIsSharing(false);
    }
  };

  // Native share (mobile)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: memeTitle,
          text: shareText,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      copyToClipboard();
    }
  };

  // Load followed users and groups for chat sharing
  const loadFollowedUsers = async () => {
    if (!user) return;

    try {
      setIsSharing(true);

      // Load followed users
      const followers = await UserService.getFollowedUsers(user.uid);
      setFollowedUsers(followers);

      // Load user's groups
      const chats = await ChatService.getUserChats(user.uid);
      const groups = chats.filter(chat => chat.type === 'group');
      setUserGroups(groups);

    } catch (error) {
      console.error('Error loading followers and groups:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Handle sending meme to selected users and groups
  const handleSendToChat = async () => {
    if (!user || (selectedUsers.length === 0 && selectedGroups.length === 0)) return;

    try {
      setSendingToChat(true);
      const userProfile = await UserService.getUserProfile(user.uid);
      const userName = userProfile?.nickname || user.displayName || 'Anonymous';

      // Extract publicId from Cloudinary URL more reliably
      let publicId = null;
      if (memeImageUrl.includes('cloudinary')) {
        // Handle different Cloudinary URL formats
        const urlParts = memeImageUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          // Get the part after version (v1234567890)
          const filenamePart = urlParts[uploadIndex + 2];
          publicId = filenamePart.split('.')[0]; // Remove file extension
        }
      }

      const memeData = {
        memeId,
        title: memeTitle,
        imageUrl: memeImageUrl,
        authorName,
        publicId
      };

      // Send to each selected user (direct chats)
      for (const recipientId of selectedUsers) {
        // Create or get direct chat
        const chat = await ChatService.createDirectChat(user.uid, recipientId);
        await ChatService.sendMemeMessage(chat.id, user.uid, userName, memeData);
      }

      // Send to each selected group
      for (const groupId of selectedGroups) {
        await ChatService.sendMemeMessage(groupId, user.uid, userName, memeData);
      }

      const totalRecipients = selectedUsers.length + selectedGroups.length;
      const recipientText = totalRecipients === 1 ? 'recipient' : 'recipients';
      toast.success(`Meme shared with ${totalRecipients} ${recipientText}!`);

      setSelectedUsers([]);
      setSelectedGroups([]);
      setShowChatShare(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending meme to chat:', error);
      toast.error('Failed to share meme');
    } finally {
      setSendingToChat(false);
    }
  };

  // Select single user (radio button behavior)
  const selectUser = (userId: string) => {
    setSelectedUsers([userId]); // Always select only this user
    setSelectedGroups([]); // Clear group selection
  };

  // Select single group (radio button behavior)
  const selectGroup = (groupId: string) => {
    setSelectedGroups([groupId]); // Always select only this group
    setSelectedUsers([]); // Clear user selection
  };

  // Share platforms
  const platforms: SharePlatform[] = [
    {
      name: "Twitter",
      icon: "🐦",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;
        window.open(url, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: "Facebook",
      icon: "📘",
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: "WhatsApp",
      icon: "💬",
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
        window.open(url, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: "Instagram",
      icon: "📸",
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      action: () => {
        setShowInstagramOptions(true);
      }
    },
    {
      name: "Reddit",
      icon: "🤖",
      color: "bg-orange-500 hover:bg-orange-600",
      action: () => {
        const url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: "Telegram",
      icon: "✈️",
      color: "bg-blue-400 hover:bg-blue-500",
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: "LinkedIn",
      icon: "💼",
      color: "bg-blue-700 hover:bg-blue-800",
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setIsOpen(false);
      }
    },
    {
      name: "Chat",
      icon: "💬➤",
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => {
        if (!user) {
          toast.error('Please sign in to share to chat');
          return;
        }
        // Reset selected users and groups when opening the modal
        setSelectedUsers([]);
        setSelectedGroups([]);
        setActiveTab('followers');
        setShowChatShare(true);
        loadFollowedUsers();
      }
    }
  ];

  return (
    <>
      {/* Share Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-1 sm:space-x-2 text-text-secondary hover:text-green-500 transition-colors"
        disabled={isSharing}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </motion.button>

      {/* Share Overlay - positioned absolutely over the meme card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            {/* Blurred Background */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl" />

            {/* Share Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="relative w-72 bg-card rounded-xl shadow-2xl border border-primary/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-primary/10">
                <h3 className="font-semibold text-foreground text-base">Share this meme</h3>
                <p className="text-sm text-text-secondary mt-1 truncate">{memeTitle}</p>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-primary/10">
                <div className="grid grid-cols-2 gap-3">
                  {/* Native Share / Copy */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nativeShare}
                    className="flex items-center space-x-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200"
                  >
                    <span className="text-lg">📱</span>
                    <span className="text-sm font-medium text-foreground">
                      {navigator.share ? 'Share' : 'Copy Link'}
                    </span>
                  </motion.button>

                  {/* Download */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadMeme}
                    disabled={isSharing}
                    className="flex items-center space-x-2 p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <span className="text-lg">📥</span>
                    <span className="text-sm font-medium text-foreground">
                      {isSharing ? 'Downloading...' : 'Download'}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Social Platforms */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((platform, index) => (
                    <motion.button
                      key={`platform-${platform.name}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={platform.action}
                      className={`flex flex-col items-center p-3 rounded-lg text-white transition-all duration-200 ${platform.color}`}
                    >
                      <span className="text-xl mb-1">{platform.icon}</span>
                      <span className="text-xs font-medium">{platform.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Copy Link */}
              <div className="p-4 border-t border-primary/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200"
                >
                  <span className="text-lg">📋</span>
                  <span className="text-sm font-medium text-foreground">Copy Link</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instagram Options Overlay */}
      <AnimatePresence>
        {showInstagramOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowInstagramOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-xl shadow-2xl border border-primary/20 max-w-sm w-full"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Share to Instagram</h3>
                  <p className="text-sm text-text-secondary">Choose where to share your meme</p>
                </div>

                <div className="space-y-3">
                  {/* Instagram Story */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      window.open('https://www.instagram.com/stories/camera/', '_blank');
                      copyToClipboard();
                      toast.success("Link copied! Paste it in your Instagram story", { duration: 4000 });
                      setShowInstagramOptions(false);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-lg transition-all duration-200 border border-purple-500/20"
                  >
                    <span className="text-xl">📖</span>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Story</p>
                      <p className="text-xs text-text-secondary">Share to your Instagram story</p>
                    </div>
                  </motion.button>

                  {/* Instagram Post */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      window.open('https://www.instagram.com/', '_blank');
                      copyToClipboard();
                      toast.success("Link copied! Create a new post and paste the link", { duration: 4000 });
                      setShowInstagramOptions(false);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-lg transition-all duration-200 border border-purple-500/20"
                  >
                    <span className="text-xl">📷</span>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Post</p>
                      <p className="text-xs text-text-secondary">Share as a new Instagram post</p>
                    </div>
                  </motion.button>

                  {/* Instagram Direct */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      window.open('https://www.instagram.com/direct/inbox/', '_blank');
                      copyToClipboard();
                      toast.success("Link copied! Paste it in your Instagram chat", { duration: 4000 });
                      setShowInstagramOptions(false);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-lg transition-all duration-200 border border-purple-500/20"
                  >
                    <span className="text-xl">💬</span>
                    <div className="text-left">
                      <p className="font-medium text-foreground">Direct Message</p>
                      <p className="text-xs text-text-secondary">Send in Instagram chat</p>
                    </div>
                  </motion.button>
                </div>

                {/* Back Button */}
                <div className="mt-6 pt-4 border-t border-primary/10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInstagramOptions(false)}
                    className="w-full p-3 text-text-secondary hover:text-foreground transition-colors text-sm font-medium"
                  >
                    ← Back to sharing options
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Share Modal */}
      <AnimatePresence>
        {showChatShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowChatShare(false);
              setSelectedUsers([]);
              setSelectedGroups([]);
              setSearchQuery("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Share</h3>
                  <button
                    onClick={() => {
                      setShowChatShare(false);
                      setSelectedUsers([]);
                      setSelectedGroups([]);
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

              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('followers')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'followers'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-text-secondary hover:text-foreground'
                    }`}
                  >
                    Followers ({followedUsers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'groups'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-text-secondary hover:text-foreground'
                    }`}
                  >
                    Groups ({userGroups.length})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={activeTab === 'followers' ? 'Search followers...' : 'Search groups...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto p-4 max-h-80">
                {isSharing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-text-secondary mt-2">Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTab === 'followers' ? (
                      <>
                        {followedUsers
                          .filter(user =>
                            user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((follower) => {
                            const isSelected = selectedUsers.includes(follower.uid);
                            const avatarData = follower.avatar ? getAvatarById(follower.avatar) : null;
                            return (
                              <div
                                key={`follower-${follower.uid}`}
                                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-primary/10'
                                    : 'hover:bg-secondary/50'
                                }`}
                              >
                                {/* Radio button */}
                                <div
                                  className="mr-3 w-5 h-5 rounded-full border-2 border-primary flex-shrink-0 relative cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectUser(follower.uid);
                                  }}
                                >
                                  {isSelected && (
                                    <div className="absolute inset-1 rounded-full bg-primary"></div>
                                  )}
                                </div>

                                {/* User info */}
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                                    {avatarData?.url || '👤'}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">{follower.nickname}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {followedUsers.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-text-secondary">No followers found</p>
                            <p className="text-sm text-text-secondary mt-1">Follow some users to share memes with them!</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {userGroups
                          .filter(group =>
                            group.name?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((group) => {
                            const isSelected = selectedGroups.includes(group.id);
                            return (
                              <div
                                key={`group-${group.id}`}
                                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-primary/10'
                                    : 'hover:bg-secondary/50'
                                }`}
                              >
                                {/* Radio button */}
                                <div
                                  className="mr-3 w-5 h-5 rounded-full border-2 border-primary flex-shrink-0 relative cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectGroup(group.id);
                                  }}
                                >
                                  {isSelected && (
                                    <div className="absolute inset-1 rounded-full bg-primary"></div>
                                  )}
                                </div>

                                {/* Group info */}
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg overflow-hidden border border-primary/30">
                                    {group.avatar?.startsWith('http') ? (
                                      <img
                                        src={group.avatar}
                                        alt="Group avatar"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-lg">
                                        {getAvatarById(group.avatar || '👥')?.url || '👥'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">{group.name || 'Group Chat'}</p>
                                    <p className="text-xs text-text-secondary">{group.participants.length} members</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {userGroups.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-text-secondary">No groups found</p>
                            <p className="text-sm text-text-secondary mt-1">Create or join groups to share memes!</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Send Button */}
              {(selectedUsers.length > 0 || selectedGroups.length > 0) && (
                <div className="p-4 border-t border-border">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendToChat}
                    disabled={sendingToChat}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
                  >
                    {sendingToChat ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      (() => {
                        const totalSelected = selectedUsers.length + selectedGroups.length;
                        if (selectedUsers.length > 0 && selectedGroups.length > 0) {
                          return `Send to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} & ${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''}`;
                        } else if (selectedUsers.length > 0) {
                          return selectedUsers.length === 1 ? 'Send to 1 user' : `Send to ${selectedUsers.length} users`;
                        } else {
                          return selectedGroups.length === 1 ? 'Send to 1 group' : `Send to ${selectedGroups.length} groups`;
                        }
                      })()
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
