"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserService } from "@/lib/userService";
import { UserProfile, getAvatarById } from "../../../types/user";
import { Meme } from "../../../types/meme";
import MemeCard from "../../components/MemeCard";

export default function UserProfilePage() {
  const params = useParams();
  const nickname = params.nickname as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [memesLoading, setMemesLoading] = useState(true);

  useEffect(() => {
    if (nickname) {
      loadUserData();
    }
  }, [nickname]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setMemesLoading(true);

      // Load user profile
      const userData = await UserService.getUserByNickname(decodeURIComponent(nickname));
      setUser(userData);

      if (userData) {
        // Load user's memes
        const q = query(
          collection(db, "memes"),
          where("authorId", "==", userData.uid)
        );

        const querySnapshot = await getDocs(q);
        const userMemes: Meme[] = [];

        querySnapshot.forEach((doc) => {
          const memeData = { id: doc.id, ...doc.data() } as Meme;
          userMemes.push(memeData);
        });

        // Sort by creation date (newest first)
        userMemes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setMemes(userMemes);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
      setMemesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-secondary rounded-full"></div>
              <div>
                <div className="h-6 bg-secondary rounded w-32 mb-2"></div>
                <div className="h-4 bg-secondary rounded w-48"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-secondary rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              User not found
            </h3>
            <p className="text-text-secondary">
              The user @{decodeURIComponent(nickname)} doesn't exist.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-3 bg-secondary text-text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              ← Go Back
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* User Profile Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-xl p-6 border border-border mb-8"
        >
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl">
              {getAvatarById(user.avatar)?.url || user.avatar}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                @{user.nickname}
              </h1>
              
              {user.bio && (
                <p className="text-text-secondary mb-4 max-w-2xl">
                  {user.bio}
                </p>
              )}
              
              <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
                <div className="flex items-center space-x-2">
                  <span className="text-primary">📊</span>
                  <span>{memes.length} active memes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-accent">❤️</span>
                  <span>{user.stats?.totalLikes || 0} total likes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">💬</span>
                  <span>{user.stats?.totalComments || 0} total comments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">📅</span>
                  <span>
                    Joined {new Date(user.stats?.joinedAt || user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User's Memes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Active Memes by @{user.nickname} ({memes.length})
          </h2>
          
          {memesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-secondary rounded-xl h-64"></div>
              ))}
            </div>
          ) : memes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No memes yet
              </h3>
              <p className="text-text-secondary">
                @{user.nickname} hasn't uploaded any memes yet.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memes.map((meme, index) => (
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
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-secondary text-text-primary rounded-lg hover:bg-primary/10 transition-colors"
          >
            ← Back to Search
          </button>
        </motion.div>
      </div>
    </div>
  );
}
