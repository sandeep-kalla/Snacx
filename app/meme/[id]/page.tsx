"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import MemeCard from "../../components/MemeCard";
import { UserService } from "@/lib/userService";
import { UserProfile } from "../../../types/user";

interface Meme {
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
  createdAt: number;
}

export default function MemePage() {
  const params = useParams();
  const router = useRouter();
  const memeId = params.id as string;
  
  const [meme, setMeme] = useState<Meme | null>(null);
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeme = async () => {
      try {
        // Get meme data
        const memeDoc = await getDoc(doc(db, "memes", memeId));
        
        if (!memeDoc.exists()) {
          setError("Meme not found");
          return;
        }

        const memeData = { id: memeDoc.id, ...memeDoc.data() } as Meme;
        setMeme(memeData);

        // Get author profile
        try {
          const profile = await UserService.getUserProfile(memeData.authorId);
          setAuthorProfile(profile);
        } catch (profileError) {
          console.error("Error loading author profile:", profileError);
        }

      } catch (error) {
        console.error("Error loading meme:", error);
        setError("Failed to load meme");
      } finally {
        setLoading(false);
      }
    };

    if (memeId) {
      loadMeme();
    }
  }, [memeId]);

  // Update document title and meta tags
  useEffect(() => {
    if (meme) {
      document.title = `${meme.title} - Snacx`;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Check out this hilarious meme "${meme.title}" by ${authorProfile?.nickname || meme.authorName} on Snacx!`);
      }
    }
  }, [meme, authorProfile]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading meme...</p>
        </div>
      </div>
    );
  }

  if (error || !meme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {error || "Meme not found"}
          </h1>
          <p className="text-text-secondary mb-6">
            This meme might have been deleted or the link is incorrect.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200"
          >
            Back to Home
          </motion.button>
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back Button */}
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="flex items-center space-x-2 mb-6 text-text-secondary hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </motion.button>

        {/* Page Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            {meme?.title || 'Untitled Meme'}
          </h1>
          <p className="text-text-secondary">
            by {authorProfile?.nickname || meme?.authorName || 'Unknown'}
          </p>
        </motion.div>

        {/* Meme Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-md">
            {meme && (
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
            )}
          </div>
        </motion.div>

        {/* Share Prompt */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-8"
        >
          <p className="text-text-secondary mb-4">
            Enjoyed this meme? Share it with your friends!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-all duration-200 border border-primary/20"
          >
            Discover More Memes
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
