"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationService } from "@/lib/notificationService";
import { UserService } from "@/lib/userService";
import { NotificationData } from "@/types/follow";
import { useAuth } from "../context/AuthContext";
import { useRealTimeNotifications, useNotificationAlerts } from "../hooks/useRealTimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { getAvatarById } from "@/types/user";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[userId: string]: string}>({});
  const [navigatingNotificationId, setNavigatingNotificationId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use real-time notifications hook
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useRealTimeNotifications(user?.uid || null, 20);

  // Use notification alerts hook
  const { hasNewNotification, clearNewNotificationFlag } = useNotificationAlerts(user?.uid || null);

  // Fetch user profiles for notifications
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const userIds = notifications
        .map(n => n.fromUserId)
        .filter(id => id && !userProfiles[id]);

      if (userIds.length === 0) return;

      try {
        const profiles: {[userId: string]: string} = {};
        await Promise.all(
          userIds.map(async (userId) => {
            try {
              const profile = await UserService.getUserProfile(userId);
              if (profile) {
                profiles[userId] = profile.nickname;
              }
            } catch (error) {
              console.error(`Error fetching profile for user ${userId}:`, error);
            }
          })
        );
        setUserProfiles(prev => ({ ...prev, ...profiles }));
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    if (notifications.length > 0) {
      fetchUserProfiles();
    }
  }, [notifications, userProfiles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        clearNewNotificationFlag();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, clearNewNotificationFlag]);

  const handleNotificationClick = async (notification: NotificationData) => {
    setNavigatingNotificationId(notification.id);

    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Close the dropdown
      setIsOpen(false);

      // Navigate to relevant content based on notification type
      switch (notification.type) {
        case 'follow':
          // Navigate to the profile of the user who followed
          if (notification.fromUserId) {
            router.push(`/profile/${notification.fromUserId}`);
          }
          break;

        case 'like':
        case 'comment':
        case 'reply':
          // Navigate to the dedicated meme page
          if (notification.targetId) {
            router.push(`/meme/${notification.targetId}`);
          }
          break;

        case 'achievement':
          // Navigate to achievements page
          router.push('/achievements');
          break;

        case 'chat_message':
          // Navigate to the chat
          if (notification.targetId) {
            router.push(`/chat?chatId=${notification.targetId}`);
          } else {
            router.push('/chat');
          }
          break;

        case 'group_added':
        case 'group_admin':
          // Navigate to the specific group chat
          if (notification.targetId) {
            router.push(`/chat?chatId=${notification.targetId}`);
          } else {
            router.push('/chat');
          }
          break;

        case 'group_removed':
          // Just navigate to chat list since user was removed
          router.push('/chat');
          break;

        default:
          // For unknown types, just close the dropdown
          break;
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    } finally {
      setNavigatingNotificationId(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'achievement':
        return '🏆';
      case 'reply':
        return '↩️';
      case 'chat_message':
        return '💬';
      case 'group_added':
        return '👥';
      case 'group_admin':
        return '⭐';
      case 'group_removed':
        return '❌';
      default:
        return '🔔';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          clearNewNotificationFlag();
        }}
        className={`relative p-2 text-text-secondary hover:text-primary-light transition-colors ${
          hasNewNotification ? 'animate-pulse' : ''
        }`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v5"
          />
        </svg>
        
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-primary/5 transition-colors ${
                      !notification.read ? 'bg-primary/10' : ''
                    } ${navigatingNotificationId === notification.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">
                            {notification.fromUserId === notification.userId
                              ? 'You'
                              : userProfiles[notification.fromUserId] || 'Someone'
                            }
                          </span>{' '}
                          {notification.message}
                        </p>
                        {notification.metadata?.memeTitle && (
                          <p className="text-xs text-text-secondary truncate mt-1">
                            "{notification.metadata.memeTitle}"
                          </p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      {navigatingNotificationId === notification.id ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0 mt-2"></div>
                      ) : !notification.read ? (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                      ) : null}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-text-secondary">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
