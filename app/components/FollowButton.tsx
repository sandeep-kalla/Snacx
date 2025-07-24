"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FollowService } from "@/lib/followService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

interface FollowButtonProps {
  targetUserId: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  size = "md",
  variant = "primary",
  className = "",
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Variant classes with better hover states
  const getVariantClasses = (following: boolean, hovered: boolean) => {
    if (variant === "outline") {
      if (following) {
        return hovered
          ? "border-2 border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-2 border-gray-400 text-gray-600 bg-transparent";
      }
      return "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground";
    }

    if (following) {
      return hovered ? "bg-red-500 text-white" : "bg-gray-500 text-white";
    }

    return "bg-primary text-primary-foreground hover:bg-primary-dark";
  };

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.uid === targetUserId) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        setIsCheckingStatus(true);
        const following = await FollowService.isFollowing(
          user.uid,
          targetUserId
        );
        setIsFollowing(following);
      } catch (error) {
        console.error("Error checking follow status:", error);
        toast.error("Failed to check follow status");
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (user.uid === targetUserId) {
      toast.error("You cannot follow yourself");
      return;
    }

    // Optimistic update - update UI immediately
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setIsLoading(true);

    try {
      if (wasFollowing) {
        await FollowService.unfollowUser(user.uid, targetUserId);
        toast.success("Unfollowed successfully");
      } else {
        await FollowService.followUser(user.uid, targetUserId);
        toast.success("Now following!");
      }

      // Call the callback with the new state
      if (onFollowChange) {
        onFollowChange(!wasFollowing);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      toast.error("Failed to update follow status");
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
        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded-lg h-full w-20"></div>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleFollowToggle}
      disabled={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${sizeClasses[size]}
        ${getVariantClasses(isFollowing, isHovered)}
        ${className}
        font-medium rounded-lg transition-all duration-200 
        disabled:opacity-70 disabled:cursor-not-allowed
        flex items-center space-x-2 relative overflow-hidden
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        </div>
      )}

      <div
        className={`flex items-center space-x-2 ${
          isLoading ? "opacity-50" : ""
        }`}
      >
        {isFollowing ? (
          <>
            {isHovered ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Unfollow</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Following</span>
              </>
            )}
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Follow</span>
          </>
        )}
      </div>
    </motion.button>
  );
}
