"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FollowService } from "@/lib/followService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline';
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  size = 'md',
  variant = 'primary',
  className = '',
  onFollowChange
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Variant classes
  const getVariantClasses = (following: boolean) => {
    if (variant === 'outline') {
      return following
        ? 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground'
        : 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground';
    }
    
    return following
      ? 'bg-gray-500 text-white hover:bg-red-500'
      : 'bg-primary text-primary-foreground hover:bg-primary-dark';
  };

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.uid === targetUserId) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const following = await FollowService.isFollowing(user.uid, targetUserId);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (user.uid === targetUserId) {
      toast.error('You cannot follow yourself');
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await FollowService.unfollowUser(user.uid, targetUserId);
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        await FollowService.followUser(user.uid, targetUserId);
        setIsFollowing(true);
        toast.success('Following successfully');
      }

      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button for own profile
  if (!user || user.uid === targetUserId) {
    return null;
  }

  if (isCheckingStatus) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="animate-pulse bg-gray-300 rounded-lg h-full w-20"></div>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${getVariantClasses(isFollowing)}
        ${className}
        font-medium rounded-lg transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center space-x-2
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {isFollowing ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Following</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Follow</span>
            </>
          )}
        </>
      )}
    </motion.button>
  );
}
