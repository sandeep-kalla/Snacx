"use client";

import { CldImage } from "next-cloudinary";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ClientOnlyDate from "./ClientOnlyDate";
import Link from "next/link";
import ConfirmModal from "./ConfirmModal";
import MemeDetailModal from "./MemeDetailModal";
import { deleteCloudinaryImage } from "@/utils/cloudinaryUtils";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { UserService } from "@/lib/userService";
import { UserProfile, getAvatarById } from "@/types/user";
import { AchievementService } from "@/lib/achievementService";
import { AdminService } from "@/lib/adminService";
import { ContentCountService } from "@/lib/contentCountService";
import { XPService } from "@/lib/xpService";
import { NotificationService } from "@/lib/notificationService";
import { UserInteractionService } from "@/lib/userInteractionService";
import { ViewTrackingService } from "@/lib/viewTrackingService";
import { useRealTimeMeme } from "../hooks/useRealTimeUpdates";
import { useAdmin } from "../context/AdminContext";
import ShareButton from "./ShareButton";
import DeleteButton from "./DeleteButton";
import AdminBadge from "./AdminBadge";
import LevelBadge from "./LevelBadge";
import HashtagChip from "./HashtagChip";
import HashtagText from "./HashtagText";
import { extractHashtags } from "../../types/hashtag";
import { HashtagService } from "@/lib/hashtagService";

interface MemeCardProps {
  id: string;
  publicId: string;
  imageUrl: string;
  title: string;
  authorId: string;
  authorName: string;
  likes: string[];
  comments: Array<{
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
  }>;
  createdAt?: number;
  onDelete?: (id: string) => void;
}

export default function MemeCard({
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
}: MemeCardProps) {
  // Early return if essential props are missing
  if (!id || !title || !authorId) {
    console.error('MemeCard: Missing essential props', { id, publicId, title, authorId });
    return null;
  }
  const { user } = useAuth();
  const { isAdmin, adminUser, hasPermission } = useAdmin();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(likes.includes(user?.uid || ""));
  const [likesCount, setLikesCount] = useState(likes.length);
  const [localComments, setLocalComments] = useState(comments);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiking, setIsLiking] = useState(false); // Prevent double clicks
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [authorXP, setAuthorXP] = useState<number | null>(null);
  const [commentAuthorProfiles, setCommentAuthorProfiles] = useState<{[userId: string]: UserProfile}>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [cloudinaryFailed, setCloudinaryFailed] = useState(false);

  // Use real-time updates for this meme
  const { meme: realTimeMeme } = useRealTimeMeme(id);

  // Check if current user is the owner of this meme
  const isOwner = user?.uid === authorId;

  // Update local state when real-time data changes (prioritize real-time data)
  useEffect(() => {
    // Don't update if currently processing a like to prevent double updates
    if (isLiking) return;

    if (realTimeMeme) {
      setLikesCount(realTimeMeme.likes?.length || 0);
      setIsLiked(realTimeMeme.likes?.includes(user?.uid || "") || false);
      setLocalComments(realTimeMeme.comments || []);
    } else {
      // Only use props data if no real-time data is available
      setIsLiked(user ? likes.includes(user.uid) : false);
      setLikesCount(likes.length);
    }
  }, [realTimeMeme, likes, user, isLiking]);

  // Load author profile
  useEffect(() => {
    const loadAuthorProfile = async () => {
      try {
        const [profile, xpData] = await Promise.all([
          UserService.getUserProfile(authorId),
          XPService.getUserXP(authorId)
        ]);
        setAuthorProfile(profile);
        setAuthorXP(xpData?.totalXP || null);
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



  // Check bookmark status
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (user) {
        const bookmarked = await UserInteractionService.hasInteraction(user.uid, id, 'bookmark');
        setIsBookmarked(bookmarked);
      }
    };

    checkBookmarkStatus();
  }, [user, id]);

  const handleLike = async () => {
    if (!user || isLiking) {
      if (!user) toast.error("Please sign in to like memes");
      return;
    }

    setIsLiking(true);
    const memeRef = doc(db, "memes", id);
    const operation = isLiked ? arrayRemove : arrayUnion;

    // Store original values for rollback
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;

    try {
      // Optimistic update - immediate UI feedback
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

      // Only wait for the core Firebase update
      await updateDoc(memeRef, {
        likes: operation(user.uid)
      });

      // Enable the button immediately after core update
      setIsLiking(false);

      // Run all other operations in the background without blocking UI
      if (!originalIsLiked) {
        // Background operations - don't await these
        Promise.all([
          // Trending score update
          (async () => {
            try {
              const currentTime = Date.now();
              const memeAge = currentTime - (createdAt || currentTime);
              const ageInHours = memeAge / (1000 * 60 * 60);

              let trendingBoost = 0;
              if (ageInHours < 24) {
                trendingBoost = Math.max(0, 100 - ageInHours * 4);
              }

              if (trendingBoost > 0) {
                await updateDoc(memeRef, {
                  trendingScore: (originalLikesCount + 1) * (1 + trendingBoost / 100),
                  lastTrendingUpdate: currentTime
                });
              }
            } catch (error) {
              console.log('Trending score update failed:', error);
            }
          })(),

          // Achievement and XP tracking
          (async () => {
            try {
              await Promise.all([
                AchievementService.trackUserAction(user.uid, 'likes_given'),
                XPService.awardXP(user.uid, 'meme_like_given', undefined, 'Liked a meme')
              ]);
            } catch (error) {
              console.log('User achievement/XP update failed:', error);
            }
          })(),

          // Author stats and achievements
          (async () => {
            try {
              const authorHadNoLikes = originalLikesCount === 0;

              const authorPromises = [
                UserService.incrementUserStats(authorId, 'totalLikes'),
                AchievementService.trackUserAction(authorId, 'total_likes_received'),
                XPService.awardXP(authorId, 'meme_like_received', undefined, 'Received a like on your meme')
              ];

              if (authorHadNoLikes) {
                authorPromises.push(
                  UserService.markEverReceivedLike(authorId),
                  AchievementService.trackUserAction(authorId, 'first_like')
                );
              }

              await Promise.all(authorPromises);
            } catch (error) {
              console.log('Author stats update failed:', error);
            }
          })(),

          // Notification creation
          (async () => {
            try {
              await NotificationService.createLikeNotification(user.uid, authorId, id, title);
            } catch (error) {
              console.log('Notification creation failed:', error);
            }
          })(),

          // User interaction tracking
          (async () => {
            try {
              await UserInteractionService.addInteraction(user.uid, id, 'like', {
                memeTitle: title,
                authorId: authorId
              });
            } catch (error) {
              console.log('User interaction tracking failed:', error);
            }
          })(),

          // Viral meme check
          (async () => {
            try {
              const newLikesCount = originalLikesCount + 1;
              if (newLikesCount >= 100) {
                await Promise.all([
                  AchievementService.trackUserAction(authorId, 'viral_meme', newLikesCount),
                  XPService.awardXP(authorId, 'viral_meme', undefined, 'Your meme went viral!')
                ]);
              }
            } catch (error) {
              console.log('Viral meme check failed:', error);
            }
          })()
        ]).catch(error => {
          console.log('Background operations failed:', error);
        });
      } else {
        // Unlike operations - also run in background
        Promise.all([
          UserService.incrementUserStats(authorId, 'totalLikes', -1),
          UserInteractionService.removeInteraction(user.uid, id, 'like')
        ]).catch(error => {
          console.log('Unlike operations failed:', error);
        });
      }

      toast.success(originalIsLiked ? "Meme unliked" : "Meme liked!");
    } catch (error) {
      console.error("Error updating like:", error);

      // Rollback optimistic update on error
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
      setIsLiking(false);

      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark memes");
      return;
    }

    try {
      if (isBookmarked) {
        await UserInteractionService.removeInteraction(user.uid, id, 'bookmark');
        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await UserInteractionService.addInteraction(user.uid, id, 'bookmark', {
          memeTitle: title,
          authorId: authorId
        });
        setIsBookmarked(true);
        toast.success("Meme bookmarked");
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleDeleteMeme = async (): Promise<boolean> => {
    if (!user) return false;

    // Check permissions
    const canDelete = isOwner || (isAdmin && hasPermission('delete_any_post'));
    if (!canDelete) return false;

    try {
      // Admin deletion
      if (isAdmin && !isOwner && adminUser) {
        const success = await AdminService.deletePost(adminUser, id, authorId, 'Admin deletion');
        if (success) {
          // Recalculate achievements for the author
          await AchievementService.recalculateAchievements(authorId);
          setIsDeleted(true);
          if (onDelete) onDelete(id);
          return true;
        }
        return false;
      }

      // Owner deletion
      if (isOwner) {
        // Remove hashtags before deleting meme
        await HashtagService.removeMemeHashtags(id);

        // Delete from Firestore
        await deleteDoc(doc(db, "memes", id));

        // Delete from Cloudinary
        try {
          await deleteCloudinaryImage(publicId);
        } catch (cloudinaryError) {
          console.error("Error deleting image from Cloudinary:", cloudinaryError);
        }

        // Recalculate achievements
        await AchievementService.recalculateAchievements(user.uid);

        setIsDeleted(true);
        if (onDelete) onDelete(id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting meme:", error);
      return false;
    }
  };

  // If this meme is deleted, don't render it
  if (isDeleted) {
    return null;
  }

  const openDetailModal = async () => {
    setShowDetailModal(true);

    // Track view when modal is opened
    try {
      await ViewTrackingService.trackView(id, user?.uid);
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  // This function will be called when a comment is added in the detail modal
  const updateComments = (newComments: typeof comments) => {
    setLocalComments(newComments);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="relative bg-card/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-primary/20 hover:border-primary/40 transition-all duration-300 flex flex-col h-full"
      >
        <div
          className="relative group cursor-pointer"
          onClick={openDetailModal}
        >
          <div className="aspect-square w-full relative overflow-hidden">
            {publicId && !cloudinaryFailed ? (
              <CldImage
                src={publicId}
                alt={title}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={(e) => {
                  console.log('Cloudinary image failed for publicId:', publicId, 'falling back to imageUrl');
                  setCloudinaryFailed(true);
                  // Prevent the error from bubbling up
                  e.preventDefault();
                }}
              />
            ) : publicId && cloudinaryFailed ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Final fallback to placeholder
                  console.log('Image failed to load:', imageUrl);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMzAwQzI1NS4yMjggMzAwIDMwMCAyNTUuMjI4IDMwMCAyMDBDMzAwIDE0NC43NzIgMjU1LjIyOCAxMDAgMjAwIDEwMEMxNDQuNzcyIDEwMCAxMDAgMTQ0Ljc3MiAxMDAgMjAwQzEwMCAyNTUuMjI4IDE0NC43NzIgMzAwIDIwMCAzMDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjAwIDI0MEM0NC4xODI4IDI0MCA2MCAyMjQuMTgzIDYwIDIwMEM2MCAxNzUuODE3IDc1LjgxNzIgMTYwIDIwMCAxNjBDMjI0LjE4MyAxNjAgMjQwIDE3NS44MTcgMjQwIDIwMEMyNDAgMjI0LjE4MyAyMjQuMTgzIDI0MCAyMDAgMjQwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Link
              href={`/profile/${authorId}`}
              className="flex items-center space-x-1 sm:space-x-2 hover:text-primary-light transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${authorId}`);
                    }}
                    className="font-medium text-foreground text-sm sm:text-base truncate max-w-[120px] sm:max-w-[160px] hover:underline hover:text-primary transition-colors"
                  >
                    {authorProfile?.nickname || authorName}
                  </button>
                  {authorXP !== null && (
                    <LevelBadge
                      xp={authorXP}
                      size="xs"
                      showLevel={false}
                      animated={false}
                    />
                  )}
                </div>
              </div>
              {createdAt && (
                <ClientOnlyDate
                  date={createdAt}
                  addSuffix={true}
                  className="text-xs text-text-secondary hidden xs:inline-block"
                />
              )}
            </Link>
            {isOwner && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.button>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 cursor-pointer line-clamp-2" onClick={openDetailModal}>
            <HashtagText
              text={title}
              onHashtagClick={(hashtag) => {
                router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
              }}
              animated={true}
            />
          </h3>

          {/* Hashtags */}
          {(() => {
            const hashtags = extractHashtags(title);
            return hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {hashtags.slice(0, 3).map((hashtag) => (
                  <HashtagChip
                    key={hashtag}
                    hashtag={hashtag}
                    size="xs"
                    variant="minimal"
                    clickable={false}
                    showCount={false}
                    showEmoji={false}
                  />
                ))}
                {hashtags.length > 3 && (
                  <span className="text-xs text-text-secondary">
                    +{hashtags.length - 3} more
                  </span>
                )}
              </div>
            );
          })()}

          <div className="flex items-center space-x-4 sm:space-x-6 mb-2">
            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
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
              <span className="text-sm sm:text-base">{likesCount}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                openDetailModal();
              }}
              className="flex items-center space-x-1 sm:space-x-2 text-text-secondary hover:text-primary-light transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm sm:text-base">{localComments.length}</span>
            </motion.button>

            {/* Bookmark Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              className={`flex items-center space-x-1 sm:space-x-2 ${
                isBookmarked ? "text-yellow-500" : "text-text-secondary"
              } hover:text-yellow-500 transition-colors`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 sm:h-5 sm:w-5 ${isBookmarked ? "fill-yellow-500" : "fill-none"}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isBookmarked ? "0" : "2"}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </motion.button>



            {/* Share Button */}
            <ShareButton
              memeId={id}
              memeTitle={title}
              memeImageUrl={`https://res.cloudinary.com/dvbfanque/image/upload/${publicId}`}
              authorName={authorProfile?.nickname || authorName}
            />

            {/* Delete Button */}
            <DeleteButton
              onDelete={handleDeleteMeme}
              itemType="post"
              isOwner={isOwner}
              isAdmin={isAdmin && hasPermission('delete_any_post')}
              size="md"
            />
          </div>

          {/* Comment section */}
          <div className="mt-auto pt-2">
            <div
              className="mt-2 sm:mt-3 bg-background p-2 rounded-lg cursor-pointer text-xs sm:text-sm flex flex-col justify-center"
              onClick={openDetailModal}
            >
              {localComments.length > 0 ? (
                <>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="font-medium text-primary-light truncate max-w-[100px] sm:max-w-[140px]">
                      {(() => {
                        const lastComment = localComments[localComments.length - 1];
                        const authorProfile = commentAuthorProfiles[lastComment.userId];
                        return authorProfile?.nickname || lastComment.userName;
                      })()}
                    </span>
                  </div>
                  <p className="text-foreground mt-1 truncate">
                    {localComments[localComments.length - 1].text}
                  </p>
                  {localComments.length > 1 && (
                    <p className="text-text-secondary text-xs mt-1">
                      View all {localComments.length} comments
                    </p>
                  )}
                </>
              ) : (
                <p className="text-text-secondary text-xs sm:text-sm text-center">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMeme}
        title="Delete Meme"
        message="Are you sure you want to delete this meme? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
        error={deleteError}
      />

      <MemeDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        id={id}
        publicId={publicId}
        imageUrl={imageUrl}
        title={title}
        authorId={authorId}
        authorName={authorName}
        likes={likes}
        comments={comments}
        createdAt={createdAt}
        isLiked={isLiked}
        onLike={handleLike}
        likesCount={likesCount}
        onCommentUpdate={updateComments}
      />

    </>
  );
}
