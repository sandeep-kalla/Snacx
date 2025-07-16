"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { UserInteractionService } from "@/lib/userInteractionService";
import { MemeService } from "@/lib/memeService";
import MemeCard from "../components/MemeCard";
import { Meme } from "@/types/meme";
import toast from "react-hot-toast";

export default function LikedMemesPage() {
  const { user } = useAuth();
  const [likedMemes, setLikedMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLikedMemes();
    }
  }, [user]);

  const loadLikedMemes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's liked meme interactions
      const likedInteractions = await UserInteractionService.getUserInteractions(user.uid, 'like');
      
      // Get the actual memes
      const memePromises = likedInteractions.map(interaction => 
        MemeService.getMemeById(interaction.targetId)
      );
      
      const memes = await Promise.all(memePromises);
      const validMemes = memes.filter(meme => meme !== null) as Meme[];
      
      // Sort by interaction date (most recently liked first)
      const sortedMemes = validMemes.sort((a, b) => {
        const aInteraction = likedInteractions.find(i => i.targetId === a.id);
        const bInteraction = likedInteractions.find(i => i.targetId === b.id);
        return (bInteraction?.createdAt || 0) - (aInteraction?.createdAt || 0);
      });
      
      setLikedMemes(sortedMemes);
    } catch (error) {
      console.error('Error loading liked memes:', error);
      toast.error('Failed to load liked memes');
    } finally {
      setLoading(false);
    }
  };

  const handleMemeUpdate = (updatedMeme: Meme) => {
    setLikedMemes(prev => 
      prev.map(meme => meme.id === updatedMeme.id ? updatedMeme : meme)
    );
  };

  const handleMemeDelete = (deletedMemeId: string) => {
    setLikedMemes(prev => prev.filter(meme => meme.id !== deletedMemeId));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
          <p className="text-muted-foreground">Please sign in to view your liked memes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Liked Memes</h1>
          <p className="text-muted-foreground">
            Memes you've liked, sorted by most recent
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : likedMemes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Liked Memes Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring and like some memes to see them here!
            </p>
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Explore Memes
            </motion.a>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedMemes.map((meme, index) => (
              <motion.div
                key={meme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MemeCard
                  id={meme.id}
                  publicId={meme.publicId}
                  imageUrl={meme.imageUrl}
                  title={meme.title}
                  authorId={meme.authorId}
                  authorName={meme.authorName}
                  likes={meme.likes || []}
                  comments={meme.comments || []}
                  createdAt={meme.createdAt}
                  onDelete={() => handleMemeDelete(meme.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
