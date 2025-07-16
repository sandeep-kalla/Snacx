"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { FollowService } from "../../lib/followService";
import { MemeService } from "../../lib/memeService";
import { Meme } from "../../types/meme";
import MemeCard from "./MemeCard";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

const FollowingFeed = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadFollowingFeed();
  }, [user]);

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

  const loadFollowingFeed = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get list of users the current user is following
      const following = await FollowService.getFollowing(user.uid);
      const followingIds = following.map(f => f.followingId);
      setFollowingUsers(followingIds);

      console.log('Following data:', following);
      console.log('Following IDs:', followingIds);

      if (followingIds.length === 0) {
        setMemes([]);
        setLoading(false);
        return;
      }

      // Get memes from followed users
      const followingMemes = await MemeService.getMemesByUsers(followingIds);
      console.log('Following memes:', followingMemes);

      // Sort by creation date (newest first)
      const sortedMemes = followingMemes.sort((a, b) => b.createdAt - a.createdAt);

      setMemes(sortedMemes);
    } catch (error) {
      console.error('Error loading following feed:', error);
      toast.error('Failed to load following feed');
    } finally {
      setLoading(false);
    }
  };

  const handleMemeUpdate = (updatedMeme: Meme) => {
    setMemes(prevMemes =>
      prevMemes.map(meme =>
        meme.id === updatedMeme.id ? updatedMeme : meme
      )
    );
  };

  const handleMemeDelete = (deletedMemeId: string) => {
    setMemes(prevMemes =>
      prevMemes.filter(meme => meme.id !== deletedMemeId)
    );
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent text-transparent bg-clip-text mb-2">
            Following Feed
          </h2>
          <p className="text-muted-foreground">
            Sign in to see memes from users you follow
          </p>
        </motion.div>

        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-foreground mb-4">
            Sign In Required
          </h3>
          <p className="text-muted-foreground">
            Please sign in to access your personalized following feed.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent text-transparent bg-clip-text mb-2">
            Following Feed
          </h2>
          <p className="text-muted-foreground">
            Loading memes from users you follow...
          </p>
        </motion.div>

        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">
            Loading your personalized feed...
          </p>
        </div>
      </div>
    );
  }

  if (followingUsers.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent text-transparent bg-clip-text mb-2">
            Following Feed
          </h2>
          <p className="text-muted-foreground">
            Follow users to see their memes in your personalized feed
          </p>
        </motion.div>

        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-foreground mb-4">
            No Following Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start following other users to see their memes here!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Explore All Memes
          </motion.button>
        </div>
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent text-transparent bg-clip-text mb-2">
            Following Feed
          </h2>
          <p className="text-muted-foreground">
            Following {followingUsers.length} user{followingUsers.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-foreground mb-4">
            No Recent Memes
          </h3>
          <p className="text-muted-foreground mb-6">
            The users you follow haven't posted any memes yet. Check back later!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Explore All Memes
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent text-transparent bg-clip-text mb-2">
          Following Feed
        </h2>
        <p className="text-muted-foreground">
          {memes.length} meme{memes.length !== 1 ? 's' : ''} from {followingUsers.length} user{followingUsers.length !== 1 ? 's' : ''} you follow
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
      >
        {memes.map((meme, index) => (
          <motion.div
            key={meme.id}
            id={`meme-${meme.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="transition-all duration-300"
          >
            <MemeCard
              {...meme}
              onDelete={handleMemeDelete}
            />
          </motion.div>
        ))}
      </motion.div>

      {memes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadFollowingFeed}
            className="px-6 py-3 bg-card border border-primary/20 rounded-lg font-medium hover:border-primary/40 transition-colors"
          >
            🔄 Refresh Feed
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default FollowingFeed;
