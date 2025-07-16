"use client";

import { useState, useEffect } from 'react';
import { ChatService } from '@/lib/chatService';
import { useAuth } from '../context/AuthContext';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Function to fetch unread count
    const fetchUnreadCount = async () => {
      try {
        const count = await ChatService.getUnreadMessageCount(user.uid);
        setUnreadCount(count);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up polling every 10 seconds (more frequent)
    const interval = setInterval(fetchUnreadCount, 10000);

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Function to manually refresh unread count
  const refreshUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await ChatService.getUnreadMessageCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  // Function to immediately set unread count to zero (for when user reads messages)
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return { unreadCount, loading, refreshUnreadCount, markAllAsRead };
}
