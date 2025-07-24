"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

interface FollowState {
  isFollowing: boolean;
  followersCount: number;
}

export default function OptimizedFollowButton({
  targetUserId,
  initialIsFollowing = false,
  initialFollowersCount = 0,
  size = "md",
  variant = "primary",
  className = "",
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [followState, setFollowState] = useState<FollowState>({
    isFollowing: initialIsFollowing,
    followersCount: initialFollowersCount,
  });

  // Optimistic updates for instant UI feedback
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    followState,
    (state, action: "follow" | "unfollow") => ({
      isFollowing: action === "follow",
      followersCount:
        action === "follow"
          ? state.followersCount + 1
          : Math.max(0, state.followersCount - 1),
    })
  );

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Variant classes
  const getVariantClasses = (following: boolean) => {
    if (variant === "outline") {
      return following
        ? "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground"
        : "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground";
    }

    return following
      ? "bg-gray-500 text-white hover:bg-red-500"
      : "bg-primary text-primary-foreground hover:bg-primary-dark";
  };

  // Fetch initial follow status on mount
  useEffect(() => {
    if (!user || user.uid === targetUserId) return;

    const fetchFollowStatus = async () => {
      try {
        const response = await fetch(
          `/api/follow?followerId=${user.uid}&followingId=${targetUserId}`,
          {
            next: { revalidate: 30 }, // Cache for 30 seconds
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFollowState({
            isFollowing: data.isFollowing,
            followersCount: data.followersCount,
          });
        }
      } catch (error) {
        console.error("Error fetching follow status:", error);
      }
    };

    // Only fetch if we don't have initial data
    if (!initialIsFollowing && initialFollowersCount === 0) {
      fetchFollowStatus();
    }
  }, [user, targetUserId, initialIsFollowing, initialFollowersCount]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (user.uid === targetUserId) {
      toast.error("You cannot follow yourself");
      return;
    }

    const action = optimisticState.isFollowing ? "unfollow" : "follow";

    // Apply optimistic update immediately
    addOptimisticUpdate(action);

    startTransition(async () => {
      try {
        const response = await fetch("/api/follow", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followerId: user.uid,
            followingId: targetUserId,
            action,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update follow status");
        }

        const data = await response.json();

        // Update actual state with server response
        setFollowState({
          isFollowing: data.isFollowing,
          followersCount: data.followersCount,
        });

        // Call onFollowChange callback
        if (onFollowChange) {
          onFollowChange(data.isFollowing);
        }

        toast.success(data.message);
      } catch (error) {
        console.error("Error toggling follow:", error);

        // Revert optimistic update on error
        setFollowState(followState);
        toast.error("Failed to update follow status");
      }
    });
  };

  // Don't show button for own profile
  if (!user || user.uid === targetUserId) {
    return null;
  }

  const currentState = isPending ? optimisticState : followState;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleFollowToggle}
      disabled={isPending}
      className={`
        ${sizeClasses[size]}
        ${getVariantClasses(currentState.isFollowing)}
        ${className}
        font-medium rounded-lg transition-all duration-200 
        disabled:opacity-70 disabled:cursor-not-allowed
        flex items-center space-x-2 relative overflow-hidden
      `}
    >
      {isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/10 flex items-center justify-center"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        </motion.div>
      )}

      <motion.div
        className="flex items-center space-x-2"
        animate={{ opacity: isPending ? 0.5 : 1 }}
      >
        {currentState.isFollowing ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Following</span>
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
      </motion.div>
    </motion.button>
  );
}
