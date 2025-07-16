"use client";

import { CldImage } from "next-cloudinary";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { UserService } from "@/lib/userService";
import { UserProfile, getAvatarById } from "../../types/user";
import { AchievementService } from "@/lib/achievementService";
import { AdminService } from "@/lib/adminService";
import { ContentCountService } from "@/lib/contentCountService";
import { XPService } from "@/lib/xpService";
import { HashtagService } from "@/lib/hashtagService";
import { NotificationService } from "@/lib/notificationService";
import { CommentService } from "@/lib/commentService";
import { MentionService } from "@/lib/mentionService";
import HashtagText from "./HashtagText";
import MentionAutocomplete from "./MentionAutocomplete";
import HashtagMentionText from "./HashtagMentionText";
import CommentThread from "./CommentThread";
import { useRouter } from "next/navigation";
import { useAdmin } from "../context/AdminContext";
import DeleteButton from "./DeleteButton";

interface Comment {
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface MemeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  publicId: string;
  imageUrl: string;
  title: string;
  authorId: string;
  authorName: string;
  likes: string[];
  comments: Comment[];
  createdAt?: number;
  isLiked: boolean;
  onLike: () => void;
  likesCount: number;
  onCommentUpdate?: (comments: Comment[]) => void;
}

export default function MemeDetailModal({
  isOpen,
  onClose,
  id,
  publicId,
  imageUrl,
  title,
  authorId,
  authorName,
  likes,
  comments: initialComments,
  createdAt,
  isLiked,
  onLike,
  likesCount,
  onCommentUpdate,
}: MemeDetailModalProps) {
  const { user, userProfile } = useAuth();
  const { isAdmin, adminUser, hasPermission } = useAdmin();
  const router = useRouter();
  const [localComments, setLocalComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [commentAuthorProfiles, setCommentAuthorProfiles] = useState<{[userId: string]: UserProfile}>({});
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [cloudinaryFailed, setCloudinaryFailed] = useState(false);
  
  // Check if screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Load author profile
  useEffect(() => {
    const loadAuthorProfile = async () => {
      try {
        const profile = await UserService.getUserProfile(authorId);
        setAuthorProfile(profile);
      } catch (error) {
        console.error("Error loading author profile:", error);
      }
    };

    loadAuthorProfile();
  }, [authorId]);

  // Load comment author profiles
  useEffect(() => {
    const loadCommentAuthorProfiles = async () => {
      if (localComments.length === 0) return;

      const profiles: {[userId: string]: UserProfile} = {};
      const uniqueUserIds = [...new Set(localComments.map(comment => comment.userId))];

      try {
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const profile = await UserService.getUserProfile(userId);
              if (profile) {
                profiles[userId] = profile;
              }
            } catch (error) {
              console.error(`Error loading profile for user ${userId}:`, error);
            }
          })
        );
        setCommentAuthorProfiles(profiles);
      } catch (error) {
        console.error("Error loading comment author profiles:", error);
      }
    };

    loadCommentAuthorProfiles();
  }, [localComments]);
  
  // Close modal when clicking outside or pressing Escape
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    const comment = {
      userId: user.uid,
      userName: userProfile?.nickname || user.displayName || "Anonymous",
      text: newComment.trim(),
      timestamp: Date.now(),
    };

    const memeRef = doc(db, "memes", id);
    try {
      await updateDoc(memeRef, {
        comments: arrayUnion(comment),
      });
      setLocalComments([...localComments, comment]);
      setNewComment("");

      // Mark that user has ever commented (for permanent first_comment achievement)
      const userHadNoComments = await ContentCountService.getActiveCommentCount(user.uid) === 0;
      if (userHadNoComments) {
        await UserService.markEverCommented(user.uid);
        await AchievementService.trackUserAction(user.uid, 'first_comment');
      }

      // Process hashtags from comment
      const commentId = `comment_${id}_${Date.now()}`;
      await HashtagService.processMemeHashtags(commentId, newComment.trim());

      // Process mentions from comment
      await MentionService.processMentions(
        newComment.trim(),
        user.uid,
        userProfile?.nickname || user.displayName || "Anonymous",
        'comment',
        commentId,
        id,
        title
      );

      // Track achievements for commenting
      await AchievementService.trackUserAction(user.uid, 'comments_made');

      // Award XP for making a comment
      await XPService.awardXP(user.uid, 'comment_made', undefined, 'Made a comment');

      // Track achievements for receiving comments (for meme author)
      if (authorId !== user.uid) {
        // Update author's total comments stat
        await UserService.incrementUserStats(authorId, 'totalComments');

        // Create notification for the meme author
        await NotificationService.createCommentNotification(
          user.uid,
          authorId,
          id,
          title,
          comment.text
        );

        await AchievementService.trackUserAction(authorId, 'total_comments_received');
        // Award XP for receiving a comment
        await XPService.awardXP(authorId, 'comment_received', undefined, 'Received a comment on your meme');
      }

      toast.success("Comment added!");
      if (onCommentUpdate) {
        onCommentUpdate([...localComments, comment]);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentIndex: number): Promise<boolean> => {
    if (!user) return false;

    const comment = localComments[commentIndex];
    if (!comment) return false;

    // Check permissions: comment author, post author, or admin
    const isCommentOwner = comment.userId === user.uid;
    const isPostOwner = authorId === user.uid;
    const canDelete = isCommentOwner || isPostOwner || (isAdmin && hasPermission('delete_any_comment'));

    if (!canDelete) return false;

    try {
      // Admin deletion
      if (isAdmin && !isCommentOwner && !isPostOwner && adminUser) {
        const success = await AdminService.deleteComment(
          adminUser,
          id,
          commentIndex,
          comment.userId,
          'Admin deletion'
        );
        if (success) {
          const updatedComments = localComments.filter((_, index) => index !== commentIndex);
          setLocalComments(updatedComments);
          if (onCommentUpdate) onCommentUpdate(updatedComments);

          // Recalculate achievements for comment author
          await AchievementService.recalculateAchievements(comment.userId);
          return true;
        }
        return false;
      }

      // Owner deletion (comment owner or post owner)
      const memeRef = doc(db, "memes", id);
      const updatedComments = localComments.filter((_, index) => index !== commentIndex);

      // Remove hashtags from the deleted comment
      const commentId = `comment_${id}_${comment.timestamp}`;
      await HashtagService.removeMemeHashtags(commentId);

      // Delete all replies for this comment
      await CommentService.deleteAllRepliesForComment(comment.timestamp.toString());

      await updateDoc(memeRef, {
        comments: updatedComments
      });

      setLocalComments(updatedComments);
      if (onCommentUpdate) onCommentUpdate(updatedComments);

      // Decrement author's total comments stat if comment was from another user
      if (authorId !== comment.userId) {
        await UserService.incrementUserStats(authorId, 'totalComments', -1);
      }

      // Recalculate achievements for comment author
      await AchievementService.recalculateAchievements(comment.userId);

      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-background rounded-xl overflow-hidden max-w-6xl w-full max-h-[90vh] shadow-xl border border-primary/20 flex ${
            isMobile ? 'flex-col' : 'flex-col md:flex-row'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-300 hover:text-white z-10 bg-black/30 rounded-full p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          
          {/* Meme side */}
          <div 
            className={`w-full ${
              isMobile 
                ? 'max-h-[40vh] sm:max-h-[50vh]' 
                : 'md:w-[55%] md:max-h-[90vh]'
            } bg-card relative overflow-hidden flex flex-col`}
          >
            <div className="relative flex-grow flex items-center justify-center bg-black/30 p-2">
              {!cloudinaryFailed ? (
                <CldImage
                  src={publicId}
                  alt={title}
                  width={800}
                  height={800}
                  className="max-h-full w-auto object-contain"
                  onError={(e) => {
                    console.log('Cloudinary image failed for publicId:', publicId, 'falling back to imageUrl');
                    setCloudinaryFailed(true);
                    // Prevent the error from bubbling up
                    e.preventDefault();
                  }}
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={title}
                  className="max-h-full w-auto object-contain"
                  onError={(e) => {
                    // Final fallback to placeholder
                    console.log('Image failed to load:', imageUrl);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDgwMCA4MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MDAgNjAwQzUxMC40NTcgNjAwIDYwMCA1MTAuNDU3IDYwMCA0MDBDNTU0IDI4OS41NDMgNTEwLjQ1NyAyMDAgNDAwIDIwMEMyODkuNTQzIDIwMCAyMDAgMjg5LjU0MyAyMDAgNDAwQzIwMCA1MTAuNDU3IDI4OS41NDMgNjAwIDQwMCA2MDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMjAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNNDAwIDQ4MEM0NDguMzY2IDQ4MCA0ODAgNDQ4LjM2NiA0ODAgNDAwQzQ4MCAzNTEuNjM0IDQ0OC4zNjYgMzIwIDQwMCAzMjBDMzUxLjYzNCAzMjAgMzIwIDM1MS42MzQgMzIwIDQwMEMzMjAgNDQ4LjM2NiAzNTEuNjM0IDQ4MCA0MDAgNDgwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==';
                  }}
                />
              )}
            </div>
            
            <div className="p-3 sm:p-4 bg-card border-t border-primary/10">
              <h2 className="text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2">
                <HashtagText
                  text={title}
                  onHashtagClick={(hashtag) => {
                    router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
                  }}
                  animated={true}
                />
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {authorProfile && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {authorProfile.avatar.startsWith('http') ? (
                        <img
                          src={authorProfile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">
                          {getAvatarById(authorProfile.avatar)?.url || '🐱'}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      router.push(`/profile/${authorId}`);
                    }}
                    className="font-medium text-primary-light text-sm sm:text-base truncate max-w-[100px] sm:max-w-[200px] hover:underline hover:text-primary transition-colors"
                  >
                    {authorProfile?.nickname || authorName}
                  </button>
                  {createdAt && (
                    <span className="text-xs sm:text-sm text-text-secondary">
                      {formatDistanceToNow(createdAt, { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onLike}
                  className={`flex items-center space-x-1 sm:space-x-2 ${
                    isLiked ? "text-accent" : "text-text-secondary"
                  } hover:text-accent transition-colors`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? "fill-accent" : "fill-none"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={isLiked ? "0" : "2"}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{likesCount}</span>
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Comments side */}
          <div className={`w-full ${isMobile ? '' : 'md:w-[45%]'} flex flex-col ${isMobile ? 'max-h-[50vh]' : 'md:max-h-[90vh]'}`}>
            <div className="p-3 sm:p-4 border-b border-primary/10 bg-background">
              <h3 className="text-base sm:text-lg font-medium text-foreground">Comments</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
              {localComments.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-text-secondary italic text-sm sm:text-base">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                localComments.map((comment, index) => (
                  <motion.div
                    key={comment.timestamp}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card p-3 sm:p-4 rounded-lg"
                  >
                    <CommentThread
                      comment={comment}
                      commentId={comment.timestamp.toString()}
                      memeId={id}
                      memeTitle={title}
                      memeAuthorId={authorId}
                      onReplyAdded={() => {
                        // Optionally refresh comments or update counts
                      }}
                      onReplyDeleted={() => {
                        // Optionally refresh comments or update counts
                      }}
                    />

                    {/* Delete button for main comment */}
                    <div className="flex justify-end mt-2">
                      <DeleteButton
                        onDelete={() => handleDeleteComment(index)}
                        itemType="comment"
                        isOwner={comment.userId === user?.uid}
                        isAdmin={isAdmin && hasPermission('delete_any_comment')}
                        size="sm"
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="p-3 sm:p-4 border-t border-primary/10 bg-background">
              <form onSubmit={handleComment} className="flex space-x-2">
                <MentionAutocomplete
                  text={newComment}
                  onTextChange={setNewComment}
                  currentUserId={user?.uid || ""}
                  placeholder="Add a comment..."
                  className="flex-1 bg-input text-foreground placeholder-text-secondary rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/20"
                  onSubmit={() => {
                    if (newComment.trim()) {
                      handleComment(new Event('submit') as any);
                    }
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20 text-sm sm:text-base min-w-[60px] sm:min-w-[80px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </motion.svg>
                    </span>
                  ) : (
                    "Post"
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 