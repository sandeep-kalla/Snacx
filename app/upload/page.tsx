"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { useAchievement } from "@/app/context/AchievementContext";
import CloudinaryUploader from "@/app/components/CloudinaryUploader";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { UserService } from "@/lib/userService";
import { AchievementService } from "@/lib/achievementService";
import { XPService } from "@/lib/xpService";
import { HashtagService } from "@/lib/hashtagService";
import HashtagAutocomplete from "../components/HashtagAutocomplete";

export default function UploadPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { showAchievement } = useAchievement();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUploadSuccess = (url: string, publicId: string) => {
    setImageUrl(url);
    setPublicId(publicId);
    setError("");
    toast.success("Image uploaded successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to upload a meme");
      return;
    }

    if (!title.trim()) {
      toast.error("Please provide a title for your meme");
      return;
    }

    if (!imageUrl) {
      toast.error("Please upload an image");
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Create meme document
      const memeDoc = await addDoc(collection(db, "memes"), {
        title: title.trim(),
        imageUrl,
        publicId,
        authorId: user.uid,
        authorName: userProfile?.nickname || user.displayName || "Anonymous",
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });

      // Process hashtags from title
      const processedHashtags = await HashtagService.processMemeHashtags(memeDoc.id, title.trim());
      console.log('Processed hashtags:', processedHashtags); // Debug log

      // Award XP for upload
      await XPService.awardXP(user.uid, 'meme_uploaded', undefined, 'Uploaded a meme');

      // Check for first meme achievement BEFORE updating stats
      const isFirstMeme = !userProfile || userProfile.stats?.memesUploaded === 0;

      // Mark that user has ever uploaded (for permanent first_meme achievement)
      // Only mark if this is truly their first upload ever
      if (isFirstMeme) {
        await UserService.markEverUploaded(user.uid);
      }

      // Update user stats
      if (userProfile) {
        await UserService.incrementUserStats(user.uid, 'memesUploaded');
      }

      // Track achievements
      const currentHour = new Date().getHours();
      const newAchievements = await AchievementService.trackUserAction(
        user.uid,
        'active_memes_uploaded',
        1,
        { hour: currentHour }
      );

      // Track first meme achievement if this is the first upload
      if (isFirstMeme) {
        const firstMemeAchievements = await AchievementService.trackUserAction(
          user.uid,
          'first_meme'
        );
        newAchievements.push(...firstMemeAchievements);
      }

      // Award XP for uploading meme
      const xpResult = await XPService.awardXP(user.uid, 'meme_upload', undefined, 'Uploaded a meme');

      toast.success("Your meme has been uploaded successfully!");

      // Show achievement notifications if any
      if (newAchievements.length > 0) {
        setTimeout(() => {
          newAchievements.forEach((achievementId, index) => {
            setTimeout(() => {
              showAchievement(achievementId);
            }, index * 2000); // Stagger notifications
          });
        }, 1000);
      }

      // Show level up notification if applicable
      if (xpResult?.levelUp) {
        setTimeout(() => {
          toast.success(`🎉 Level Up! You're now level ${xpResult.newLevel}!`, { duration: 4000 });
        }, 3000);
      }
      setTitle("");
      setImageUrl("");
      setPublicId("");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error uploading meme:", error);
      toast.error("Failed to upload meme. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
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

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card p-6 sm:p-8 rounded-xl shadow-xl max-w-md w-full border border-primary/20"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-primary-light">
            Sign In Required
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6 text-center">
            You need to be signed in to upload memes. Please sign in to continue.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/")}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-2 sm:py-3 px-4 rounded-lg transition-colors shadow-lg shadow-primary/20 text-sm sm:text-base"
          >
            Go to Home
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-6 sm:py-12 px-3 sm:px-4"
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-card p-5 sm:p-8 rounded-xl shadow-xl border border-primary/20"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text">
            Upload a Meme
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-text-primary mb-1 sm:mb-2"
              >
                Title (use # for hashtags)
              </label>
              <HashtagAutocomplete
                value={title}
                onChange={setTitle}
                placeholder="Give your meme a catchy title with #hashtags..."
                className="text-sm sm:text-base"
              />
              <div className="text-xs text-text-secondary mt-1">
                💡 Type # to see popular hashtags or create new ones
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1 sm:mb-2">
                Image
              </label>
              <div className="mb-3 sm:mb-4">
                <CloudinaryUploader
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(error) => {
                    setError(error);
                    toast.error("Failed to upload image");
                  }}
                />
              </div>
            </div>

            {imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-lg overflow-hidden border border-primary/20 shadow-lg"
              >
                <div className="aspect-w-1 aspect-h-1 max-h-[250px] sm:max-h-[300px]">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-xs sm:text-sm"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={uploading || !title.trim() || !imageUrl}
              className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-2 sm:py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 text-sm sm:text-base mt-4"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
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
                  Uploading...
                </span>
              ) : (
                "Upload Meme"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
