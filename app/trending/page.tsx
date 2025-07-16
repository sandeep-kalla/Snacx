"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MemeCard from "@/app/components/MemeCard";
import { motion, AnimatePresence } from "framer-motion";

interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  publicId: string;
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

export default function TrendingPage() {
  const [trendingMemes, setTrendingMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingMemes();
  }, []);

  const fetchTrendingMemes = async () => {
    try {
      const memesRef = collection(db, "memes");

      // Get all memes and sort by trending score (likes with velocity boost)
      const querySnapshot = await getDocs(memesRef);
      const memesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Meme[];

      // Sort by trending score (if available) or fall back to like count
      const sortedMemes = memesData.sort((a, b) => {
        const scoreA = (a as any).trendingScore || (a.likes?.length || 0);
        const scoreB = (b as any).trendingScore || (b.likes?.length || 0);
        return scoreB - scoreA;
      }).slice(0, 20); // Limit to top 20

      setTrendingMemes(sortedMemes);
    } catch (error) {
      console.error("Error fetching trending memes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for meme deletion
  const handleMemeDelete = (deletedId: string) => {
    setTrendingMemes((currentMemes) => 
      currentMemes.filter((meme) => meme.id !== deletedId)
    );
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
      className="min-h-screen py-4 sm:py-8"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6 sm:mb-12"
        >
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text">
            Trending Memes
          </h1>
          <p className="text-text-secondary text-sm sm:text-lg">
            {trendingMemes.length === 0
              ? "No trending memes yet"
              : `Top ${trendingMemes.length} most liked memes`}
          </p>
        </motion.div>

        <AnimatePresence>
          {trendingMemes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card p-4 sm:p-8 rounded-xl shadow-lg border border-primary/20 text-center"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-primary-light mb-3 sm:mb-4">
                No Trending Memes
              </h2>
              <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6">
                Be the first to upload and get your meme trending!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trendingMemes.map((meme, index) => (
                <motion.div
                  key={meme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MemeCard
                    id={meme.id}
                    title={meme.title}
                    publicId={meme.publicId}
                    authorId={meme.authorId}
                    authorName={meme.authorName}
                    likes={meme.likes}
                    comments={meme.comments}
                    createdAt={meme.createdAt}
                    onDelete={handleMemeDelete}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
