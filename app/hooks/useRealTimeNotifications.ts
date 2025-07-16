"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationData } from '../../types/follow';
import { NotificationService } from '@/lib/notificationService';

interface UseRealTimeNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

export function useRealTimeNotifications(
  userId: string | null,
  maxNotifications: number = 20
): UseRealTimeNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real-time listener for notifications
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set up real-time listener for user's notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxNotifications)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsList: NotificationData[] = [];
        let unreadCounter = 0;

        snapshot.forEach((doc) => {
          const notification = {
            id: doc.id,
            ...doc.data()
          } as NotificationData;
          
          notificationsList.push(notification);
          
          if (!notification.read) {
            unreadCounter++;
          }
        });

        setNotifications(notificationsList);
        setUnreadCount(unreadCounter);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userId, maxNotifications]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await NotificationService.markAllAsRead(userId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Refresh notifications manually
  const refreshNotifications = useCallback(() => {
    if (!userId) return;
    
    // The real-time listener will automatically update the state
    // This function is here for manual refresh if needed
    setLoading(true);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };
}

// Hook for real-time unread count only (lighter weight)
export function useUnreadNotificationCount(userId: string | null): {
  unreadCount: number;
  loading: boolean;
} {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set up real-time listener for unread notifications count
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      unreadQuery,
      (snapshot) => {
        setUnreadCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to unread notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { unreadCount, loading };
}

// Hook for real-time notifications with sound/visual alerts
export function useNotificationAlerts(userId: string | null): {
  hasNewNotification: boolean;
  clearNewNotificationFlag: () => void;
} {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setHasNewNotification(false);
      setLastNotificationCount(0);
      return;
    }

    // Set up real-time listener for new notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const currentCount = snapshot.size;
        
        // If we have more notifications than before, show alert
        if (lastNotificationCount > 0 && currentCount > lastNotificationCount) {
          setHasNewNotification(true);
          
          // TODO: Add notification sound when sound file is available
          // For now, just visual notification
        }
        
        setLastNotificationCount(currentCount);
      },
      (error) => {
        console.error('Error listening to notification alerts:', error);
      }
    );

    return () => unsubscribe();
  }, [userId, lastNotificationCount]);

  const clearNewNotificationFlag = useCallback(() => {
    setHasNewNotification(false);
  }, []);

  return {
    hasNewNotification,
    clearNewNotificationFlag
  };
}

// Hook for notification preferences
export function useNotificationPreferences(userId: string | null) {
  const [preferences, setPreferences] = useState({
    likes: true,
    comments: true,
    follows: true,
    achievements: true,
    replies: true,
    soundEnabled: true,
    emailNotifications: false
  });

  useEffect(() => {
    if (!userId) return;

    // Load user's notification preferences from localStorage
    const savedPreferences = localStorage.getItem(`notificationPreferences_${userId}`);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
      }
    }
  }, [userId]);

  const updatePreferences = useCallback((newPreferences: Partial<typeof preferences>) => {
    if (!userId) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    
    // Save to localStorage
    localStorage.setItem(
      `notificationPreferences_${userId}`, 
      JSON.stringify(updatedPreferences)
    );
  }, [userId, preferences]);

  return {
    preferences,
    updatePreferences
  };
}
