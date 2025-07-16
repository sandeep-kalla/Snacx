"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserService } from "@/lib/userService";
import { XPService } from "@/lib/xpService";
import { ContentCountService } from "@/lib/contentCountService";
import { FollowService } from "@/lib/followService";
import { UserProfile, getAvatarById } from "../../../types/user";
import { UserXP } from "../../../types/userLevel";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MemeCard from "../../components/MemeCard";
import AchievementSummary from "../../components/AchievementSummary";
import LevelBadge from "../../components/LevelBadge";
import XPProgressBar from "../../components/XPProgressBar";
import FollowButton from "../../components/FollowButton";
import { useAuth } from "../../context/AuthContext";

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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [memesLoading, setMemesLoading] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0
  });
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0
  });


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userProfile, xpData] = await Promise.all([
          UserService.getUserProfile(userId),
          XPService.getUserXP(userId)
        ]);
        setProfile(userProfile);
        setUserXP(xpData);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const loadUserMemes = async () => {
      try {
        // Simplified query without orderBy to avoid composite index
        const q = query(
          collection(db, "memes"),
          where("authorId", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        const memesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Meme[];

        // Sort client-side by creation date (newest first)
        memesData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setMemes(memesData);
      } catch (error) {
        console.error("Error loading user memes:", error);
      } finally {
        setMemesLoading(false);
      }
    };

    const loadRealTimeStats = async () => {
      try {
        const stats = await ContentCountService.getUserActiveStats(userId);
        setRealTimeStats({
          totalLikes: stats.totalLikes,
          totalComments: stats.totalComments,
          totalViews: profile?.stats.totalViews || 0 // Keep using stored views for now
        });
      } catch (error) {
        console.error("Error loading real-time stats:", error);
      }
    };

    const loadFollowStats = async () => {
      try {
        const stats = await FollowService.getFollowStats(userId);
        setFollowStats(stats);
      } catch (error) {
        console.error("Error loading follow stats:", error);
      }
    };

    if (userId) {
      loadProfile();
      loadUserMemes();
      loadRealTimeStats();
      loadFollowStats();
    }
  }, [userId, profile?.stats.totalViews]);



  const isOwnProfile = user?.uid === userId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Profile Not Found</h1>
          <p className="text-text-secondary">This user profile doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card/90 backdrop-blur-sm rounded-xl p-6 border border-primary/20 mb-8"
        >
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-primary/10 rounded-full border-4 border-primary/20 flex items-center justify-center overflow-hidden">
              {profile.avatar.startsWith('http') ? (
                <img
                  src={profile.avatar}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl">
                  {getAvatarById(profile.avatar)?.url || '🐱'}
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                  {profile.nickname}
                </h1>
                {userXP && (
                  <LevelBadge
                    xp={userXP.totalXP}
                    size="lg"
                    showLevel={true}
                    animated={true}
                  />
                )}
                {!isOwnProfile && (
                  <>
                    <FollowButton
                      targetUserId={profile.uid}
                      size="md"
                      onFollowChange={() => loadFollowStats()}
                    />
                  </>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-text-secondary mb-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* XP Progress */}
              {userXP && (
                <div className="mb-6 max-w-md">
                  <XPProgressBar
                    currentXP={userXP.totalXP}
                    showDetails={true}
                    size="md"
                    animated={true}
                  />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {memes.length}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">Active Memes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {followStats.followersCount}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {followStats.followingCount}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {realTimeStats.totalLikes}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {realTimeStats.totalComments}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {realTimeStats.totalViews}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">Views</div>
                </div>
              </div>

              {/* Achievement Summary */}
              <div className="mt-6 pt-4 border-t border-primary/10">
                <AchievementSummary
                  userId={profile.uid}
                  showTitle={true}
                  maxBadges={6}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Buttons for Own Profile */}
        {user && user.uid === profile.uid && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/profile/${profile.uid}/liked`)}
                className="flex items-center space-x-2 px-4 py-2 bg-card border border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
              >
                <span className="text-red-500">❤️</span>
                <span className="text-foreground">Liked Memes</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/profile/${profile.uid}/bookmarked`)}
                className="flex items-center space-x-2 px-4 py-2 bg-card border border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
              >
                <span className="text-yellow-500">🔖</span>
                <span className="text-foreground">Bookmarked Memes</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* User's Memes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">
            {profile.nickname}'s Memes ({memes.length})
          </h2>

          {memesLoading ? (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : memes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    title={meme.title}
                    authorId={meme.authorId}
                    authorName={meme.authorName}
                    likes={meme.likes}
                    comments={meme.comments}
                    createdAt={meme.createdAt}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No memes yet
              </h3>
              <p className="text-text-secondary">
                {profile.nickname} hasn't uploaded any memes yet.
              </p>
            </div>
          )}
        </motion.div>
      </div>




    </motion.div>
  );
}
