"use client";

import { useState, useEffect, Suspense } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./context/AuthContext";
import MemeCard from "./components/MemeCard";
import TrendingHashtags from "./components/TrendingHashtags";
import HashtagFilter from "./components/HashtagFilter";
import FollowingFeed from "./components/FollowingFeed";
import { useSearchParams } from "next/navigation";

// import TopPerformersBanner from "./components/TopPerformersBanner";
import { HashtagService } from "@/lib/hashtagService";
import { motion } from "framer-motion";
import { Meme } from "@/types/meme";

function ExplorePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [allMemes, setAllMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [feedType, setFeedType] = useState<'explore' | 'following'>('explore');

  useEffect(() => {
    fetchMemes();
  }, []);

  useEffect(() => {
    filterMemes();
  }, [selectedHashtags, allMemes]);

  // Handle meme parameter from notifications
  useEffect(() => {
    const memeId = searchParams.get('meme');
    if (memeId && memes.length > 0) {
      // Wait a bit for the page to render, then scroll to the meme
      setTimeout(() => {
        const memeElement = document.getElementById(`meme-${memeId}`);
        if (memeElement) {
          memeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          // Add a highlight effect
          memeElement.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
          setTimeout(() => {
            memeElement.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams, memes]);

  const fetchMemes = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "memes"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const memesData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Meme)
      );
      setAllMemes(memesData);
      setMemes(memesData);
    } catch (error: any) {
      console.error("Error fetching memes:", error);

      // Handle Firebase permission errors specifically
      if (error?.code === 'permission-denied') {
        console.error("Firebase permission denied. Please check Firestore security rules.");
        // You could show a user-friendly error message here
      }
    } finally {
      setLoading(false);
    }
  };

  const filterMemes = async () => {
    if (selectedHashtags.length === 0) {
      setMemes(allMemes);
      return;
    }

    try {
      // Get memes for each selected hashtag
      const memeIdSets = await Promise.all(
        selectedHashtags.map(hashtag => HashtagService.getMemesByHashtag(hashtag, 100))
      );

      // Find intersection of all meme ID sets (memes that have ALL selected hashtags)
      const commonMemeIds = memeIdSets.reduce((acc, memeIds) => {
        if (acc.length === 0) return memeIds;
        return acc.filter(id => memeIds.includes(id));
      }, [] as string[]);

      // Filter allMemes to only include memes with the selected hashtags
      const filteredMemes = allMemes.filter(meme => commonMemeIds.includes(meme.id));

      setMemes(filteredMemes);
    } catch (error) {
      console.error("Error filtering memes by hashtags:", error);
      setMemes(allMemes);
    }
  };

  // Handler for meme deletion
  const handleMemeDelete = (deletedId: string) => {
    setMemes((currentMemes) => currentMemes.filter((meme) => meme.id !== deletedId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen relative"
    >
      {/* Top Performers Banner */}
      {/* <TopPerformersBanner /> */}

      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pb-4 sm:pb-6 border-b border-primary/20 mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text">
            {feedType === 'explore' ? 'Explore Memes' : 'Following Feed'}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
            {feedType === 'explore'
              ? 'Discover the latest memes from the community'
              : 'Latest memes from users you follow'
            }
          </p>

          {/* Feed Type Selector */}
          {user && (
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setFeedType('explore')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  feedType === 'explore'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                🌍 Explore All
              </button>
              <button
                onClick={() => setFeedType('following')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  feedType === 'following'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                👥 Following
              </button>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        {feedType === 'following' ? (
          <FollowingFeed />
        ) : (
          <>
            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
              {/* Left Sidebar: Hashtag Filter */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-1"
              >
                <HashtagFilter
                  selectedHashtags={selectedHashtags}
                  onHashtagsChange={setSelectedHashtags}
                  className="sticky top-24"
                />
              </motion.div>

          {/* Right Content: Filter Status */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {selectedHashtags.length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-border mb-6">
                <h3 className="text-sm font-semibold text-text-primary mb-2">
                  Filtering by: {selectedHashtags.map(tag => `#${tag}`).join(', ')}
                </h3>
                <p className="text-xs text-text-secondary">
                  Showing {memes.length} memes with the selected hashtags
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {!user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card p-4 sm:p-6 rounded-xl shadow-lg mb-6 sm:mb-8 border border-primary/20"
          >
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-primary-light">
              Welcome to Snacx!
            </h2>
            <p className="text-sm sm:text-base text-text-secondary">
              Sign in to like, comment, and upload your own memes.
            </p>
          </motion.div>
        )}

        {memes.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </motion.div>
            <h3 className="mt-4 text-xl sm:text-2xl font-medium text-text-primary">
              No memes found
            </h3>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Be the first to share a meme with the community!
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {memes.filter(meme => meme && meme.id && meme.publicId).map((meme, index) => (
              <motion.div
                key={meme.id}
                id={`meme-${meme.id}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="transition-all duration-300"
              >
                <MemeCard {...meme} onDelete={handleMemeDelete} />
              </motion.div>
            ))}
          </motion.div>
        )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ExplorePageContent />
    </Suspense>
  );
}
