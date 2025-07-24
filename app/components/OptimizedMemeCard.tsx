"use client";

import { CldImage } from "next-cloudinary";
import { useState, memo } from "react";
import { useAuth } from "../context/AuthContext";
import ClientOnlyDate from "./ClientOnlyDate";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Meme } from "@/types/meme";
import OptimizedFollowButton from "./OptimizedFollowButton";
import { useOptimistic, useTransition } from "react";

interface OptimizedMemeCardProps extends Meme {
  onDelete?: (id: string) => void;
}

// Optimized MemeCard with better performance
const OptimizedMemeCard = memo(function OptimizedMemeCard({
  id,
  publicId,
  imageUrl,
  title,
  authorId,
  authorName,
  likes = [],
  comments = [],
  createdAt,
  onDelete,
}: OptimizedMemeCardProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Optimistic updates for likes
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    { likes, count: likes.length },
    (state, action: "like" | "unlike") => ({
      likes:
        action === "like"
          ? [...state.likes, user?.uid || ""]
          : state.likes.filter((id) => id !== user?.uid),
      count: action === "like" ? state.count + 1 : state.count - 1,
    })
  );

  const isLiked = user ? optimisticLikes.likes.includes(user.uid) : false;

  // Early return if essential props are missing
  if (!id || !title || !authorId) {
    console.error("OptimizedMemeCard: Missing essential props", {
      id,
      publicId,
      title,
      authorId,
    });
    return null;
  }

  const handleLike = () => {
    if (!user) {
      toast.error("Please sign in to like memes");
      return;
    }

    const action = isLiked ? "unlike" : "like";
    addOptimisticLike(action);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/memes/${id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, userId: user.uid }),
        });

        if (!response.ok) {
          throw new Error("Failed to update like");
        }

        // The optimistic update is already applied
        toast.success(action === "like" ? "Liked!" : "Unliked!");
      } catch (error) {
        console.error("Error liking meme:", error);
        // Revert optimistic update on error
        addOptimisticLike(action === "like" ? "unlike" : "like");
        toast.error("Failed to update like");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Image with optimized loading */}
      <div className="relative aspect-square">
        <CldImage
          src={publicId}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          priority={false} // Don't prioritize all images
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Author info */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/user/${authorId}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-text-secondary truncate">
              {authorName}
            </span>
          </Link>

          {/* Follow button for other users */}
          {user && user.uid !== authorId && (
            <OptimizedFollowButton
              targetUserId={authorId}
              size="sm"
              variant="outline"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <div className="flex items-center space-x-4">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={isPending}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? "text-red-500" : "hover:text-red-500"
              } ${isPending ? "opacity-50" : ""}`}
            >
              <svg
                className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{optimisticLikes.count}</span>
            </button>

            {/* Comments */}
            <Link
              href={`/meme/${id}`}
              className="flex items-center space-x-1 hover:text-primary transition-colors"
            >
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{comments.length}</span>
            </Link>
          </div>

          {/* Date */}
          <ClientOnlyDate date={createdAt} />
        </div>
      </div>
    </motion.div>
  );
});

export default OptimizedMemeCard;
