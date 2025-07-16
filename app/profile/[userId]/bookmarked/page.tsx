"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserInteractionService } from "@/lib/userInteractionService";
import { UserService } from "@/lib/userService";
import { UserProfile, getAvatarById } from "../../../../types/user";
import { UserInteraction } from "../../../../types/follow";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MemeCard from "../../../components/MemeCard";
import { useAuth } from "../../../context/AuthContext";

interface Meme {
  id: string;
  publicId: string;
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
  createdAt: number;
}

export default function BookmarkedMemesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookmarkedInteractions, setBookmarkedInteractions] = useState<UserInteraction[]>([]);
  const [bookmarkedMemes, setBookmarkedMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [memesLoading, setMemesLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await UserService.getUserProfile(userId);
        setProfile(userProfile);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadBookmarkedMemes = async () => {
      try {
        // Get user's bookmarked interactions
        const interactions = await UserInteractionService.getUserBookmarkedMemes(userId, 100);
        setBookmarkedInteractions(interactions);

        // Get the actual meme data for each bookmarked meme
        if (interactions.length > 0) {
          const memeIds = interactions.map(interaction => interaction.targetId);
          const memePromises = memeIds.map(async (memeId) => {
            try {
              const docRef = doc(db, "memes", memeId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                return {
                  id: docSnap.id,
                  ...docSnap.data()
                } as Meme;
              }
              return null;
            } catch (error) {
              console.error(`Error loading meme ${memeId}:`, error);
              return null;
            }
          });

          const memes = await Promise.all(memePromises);
          const validMemes = memes.filter(meme => meme !== null) as Meme[];
          
          // Sort by bookmark date (most recent first)
          const sortedMemes = validMemes.sort((a, b) => {
            const aInteraction = interactions.find(i => i.targetId === a.id);
            const bInteraction = interactions.find(i => i.targetId === b.id);
            return (bInteraction?.createdAt || 0) - (aInteraction?.createdAt || 0);
          });

          setBookmarkedMemes(sortedMemes);
        }
      } catch (error) {
        console.error("Error loading bookmarked memes:", error);
      } finally {
        setMemesLoading(false);
      }
    };

    if (userId) {
      loadProfile();
      loadBookmarkedMemes();
    }
  }, [userId]);

  // Check if current user can view this page
  const canViewBookmarkedMemes = user && (user.uid === userId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Profile Not Found</h1>
          <p className="text-text-secondary">This user profile doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!canViewBookmarkedMemes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary">You can only view your own bookmarked memes.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pb-4 sm:pb-6 border-b border-primary/20 mb-6 sm:mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push(`/profile/${userId}`)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                {profile.avatar.startsWith('http') ? (
                  <img
                    src={profile.avatar}
                    alt="Profile avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">
                    {getAvatarById(profile.avatar)?.url || '🐱'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text">
                  Bookmarked Memes
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
                  Memes you've saved for later ({bookmarkedMemes.length})
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bookmarked Memes Grid */}
        {memesLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : bookmarkedMemes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {bookmarkedMemes.map((meme, index) => (
              <motion.div
                key={meme.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <MemeCard
                  id={meme.id}
                  publicId={meme.publicId}
                  title={meme.title}
                  authorId={meme.authorId}
                  authorName={meme.authorName}
                  likes={meme.likes}
                  comments={meme.comments}
                  createdAt={meme.createdAt}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔖</div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-3 sm:mb-4">
              No Bookmarked Memes Yet
            </h2>
            <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6">
              Start bookmarking memes to save them for later!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary-dark text-primary-foreground py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors shadow-lg shadow-primary/20 text-sm sm:text-base"
            >
              Explore Memes
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
