"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommentService } from "@/lib/commentService";
import { NotificationService } from "@/lib/notificationService";
import { UserService } from "@/lib/userService";
import { HashtagService } from "@/lib/hashtagService";
import { MentionService } from "@/lib/mentionService";
import MentionAutocomplete from "./MentionAutocomplete";
import HashtagMentionText from "./HashtagMentionText";
import { CommentReply } from "@/types/follow";
import { UserProfile, getAvatarById } from "@/types/user";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import DeleteButton from "./DeleteButton";
import HashtagText from "./HashtagText";
import { useRouter } from "next/navigation";

interface CommentThreadProps {
  comment: {
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
    replyCount?: number;
  };
  commentId: string;
  memeId: string;
  memeTitle: string;
  memeAuthorId: string;
  onReplyAdded?: () => void;
  onReplyDeleted?: () => void;
}

export default function CommentThread({
  comment,
  commentId,
  memeId,
  memeTitle,
  memeAuthorId,
  onReplyAdded,
  onReplyDeleted
}: CommentThreadProps) {
  const { user } = useAuth();
  const { isAdmin, adminUser, hasPermission } = useAdmin();
  const router = useRouter();
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [showReplies, setShowReplies] = useState(true); // Show replies by default
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [commentAuthorProfile, setCommentAuthorProfile] = useState<UserProfile | null>(null);
  const [replyAuthorProfiles, setReplyAuthorProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const loadCommentAuthor = async () => {
      try {
        const profile = await UserService.getUserProfile(comment.userId);
        if (profile) {
          setCommentAuthorProfile(profile);
        }
      } catch (error) {
        console.error("Error loading comment author:", error);
      }
    };

    const loadInitialReplies = async () => {
      if (comment.replyCount && comment.replyCount > 0) {
        await loadReplies();
      }
    };

    loadCommentAuthor();
    loadInitialReplies();
  }, [comment.userId, comment.replyCount]);

  const loadReplies = async () => {
    if (loadingReplies) return;
    
    try {
      setLoadingReplies(true);
      const commentReplies = await CommentService.getCommentReplies(commentId);
      setReplies(commentReplies);

      // Load reply author profiles
      const uniqueUserIds = [...new Set(commentReplies.map(reply => reply.userId))];
      const profilePromises = uniqueUserIds.map(async (userId) => {
        try {
          const profile = await UserService.getUserProfile(userId);
          return { userId, profile };
        } catch (error) {
          console.error(`Error loading profile for user ${userId}:`, error);
          return { userId, profile: null };
        }
      });

      const profileResults = await Promise.all(profilePromises);
      const profilesMap: Record<string, UserProfile> = {};
      profileResults.forEach(({ userId, profile }) => {
        if (profile) {
          profilesMap[userId] = profile;
        }
      });
      setReplyAuthorProfiles(profilesMap);
    } catch (error) {
      console.error("Error loading replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleShowReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleAddReply = async () => {
    if (!user || !replyText.trim()) return;

    try {
      setIsSubmittingReply(true);
      const userProfile = await UserService.getUserProfile(user.uid);
      const userName = userProfile?.nickname || user.displayName || "Anonymous";

      const newReply = await CommentService.addReply(
        memeId,
        commentId,
        user.uid,
        userName,
        replyText
      );

      // Process hashtags in the reply
      const replyHashtagId = `reply_${newReply.id}`;
      await HashtagService.processMemeHashtags(replyHashtagId, replyText);

      // Process mentions in the reply
      await MentionService.processMentions(
        replyText,
        user.uid,
        userName,
        'reply',
        newReply.id,
        memeId,
        memeTitle
      );

      setReplies(prev => [...prev, newReply]);
      setReplyText("");
      setShowReplyInput(false);

      // Create notification for the original comment author
      if (comment.userId !== user.uid) {
        await NotificationService.createReplyNotification(
          user.uid,
          comment.userId,
          memeId,
          memeTitle,
          replyText
        );
      }

      // Also notify meme author if different from comment author
      if (memeAuthorId !== user.uid && memeAuthorId !== comment.userId) {
        await NotificationService.createCommentNotification(
          user.uid,
          memeAuthorId,
          memeId,
          memeTitle,
          `Replied: ${replyText}`
        );
      }

      toast.success("Reply added!");
      if (onReplyAdded) onReplyAdded();
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      // Remove hashtags from the deleted reply
      const replyHashtagId = `reply_${replyId}`;
      await HashtagService.removeMemeHashtags(replyHashtagId);

      await CommentService.deleteReply(replyId, memeId, commentId);
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
      toast.success("Reply deleted");
      if (onReplyDeleted) onReplyDeleted();
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  const canDeleteReply = (reply: CommentReply) => {
    if (!user) return false;
    return reply.userId === user.uid || 
           comment.userId === user.uid || 
           memeAuthorId === user.uid ||
           (isAdmin && hasPermission('delete_any_comment'));
  };

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
          {commentAuthorProfile ? (
            commentAuthorProfile.avatar.startsWith('http') ? (
              <img
                src={commentAuthorProfile.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getAvatarById(commentAuthorProfile.avatar)?.url || '🐱'}</span>
            )
          ) : (
            <span>👤</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={() => router.push(`/profile/${comment.userId}`)}
              className="font-medium text-primary-light text-sm hover:underline"
            >
              {commentAuthorProfile?.nickname || comment.userName}
            </button>
            <span className="text-xs text-text-secondary">
              {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-foreground text-sm break-words">
            <HashtagMentionText
              text={comment.text}
              onHashtagClick={(hashtag) => {
                router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
              }}
            />
          </p>
          
          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-xs text-text-secondary hover:text-primary transition-colors"
            >
              Reply
            </button>
            
            {(comment.replyCount || 0) > 0 && (
              <button
                onClick={handleShowReplies}
                className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center space-x-1"
              >
                <span>{showReplies ? 'Hide' : 'Show'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}</span>
                <svg 
                  className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-11 space-y-2"
          >
            <MentionAutocomplete
              text={replyText}
              onTextChange={setReplyText}
              currentUserId={user?.uid || ""}
              placeholder="Write a reply..."
              className="w-full p-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              onSubmit={handleAddReply}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {replyText.length}/500
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyText("");
                  }}
                  className="px-3 py-1 text-xs text-text-secondary hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSubmittingReply ? "Posting..." : "Reply"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replies */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-11 space-y-3 border-l-2 border-primary/20 pl-4"
          >
            {loadingReplies ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : replies.length > 0 ? (
              replies.map((reply) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                    {replyAuthorProfiles[reply.userId] ? (
                      replyAuthorProfiles[reply.userId].avatar.startsWith('http') ? (
                        <img
                          src={replyAuthorProfiles[reply.userId].avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getAvatarById(replyAuthorProfiles[reply.userId].avatar)?.url || '🐱'}</span>
                      )
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <button
                        onClick={() => router.push(`/profile/${reply.userId}`)}
                        className="font-medium text-primary-light text-xs hover:underline"
                      >
                        {replyAuthorProfiles[reply.userId]?.nickname || reply.userName}
                      </button>
                      <span className="text-xs text-text-secondary">
                        {formatDistanceToNow(reply.timestamp, { addSuffix: true })}
                      </span>
                      {canDeleteReply(reply) && (
                        <DeleteButton
                          onDelete={() => handleDeleteReply(reply.id)}
                          itemType="reply"
                          isOwner={reply.userId === user?.uid}
                          isAdmin={isAdmin && hasPermission('delete_any_comment')}
                          size="xs"
                        />
                      )}
                    </div>
                    
                    <p className="text-foreground text-xs break-words">
                      <HashtagMentionText
                        text={reply.text}
                        onHashtagClick={(hashtag) => {
                          router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
                        }}
                      />
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-text-secondary italic">No replies yet</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
