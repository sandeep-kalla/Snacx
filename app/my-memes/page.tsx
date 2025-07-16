"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
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

export default function MyMemesPage() {
  const { user, loading: authLoading } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchMyMemes();
    }
  }, [user, authLoading, router]);

  const fetchMyMemes = async () => {
    try {
      const memesRef = collection(db, "memes");
      const q = query(memesRef, where("authorId", "==", user?.uid));
      const querySnapshot = await getDocs(q);
      const memesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Meme[];
      setMemes(memesData);
    } catch (error) {
      console.error("Error fetching memes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for meme deletion
  const handleMemeDelete = (deletedId: string) => {
    setMemes((currentMemes) => 
      currentMemes.filter((meme) => meme.id !== deletedId)
    );
  };

  if (authLoading || loading) {
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
            My Memes
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary">
            {memes.length === 0
              ? "You haven't uploaded any memes yet"
              : `You've uploaded ${memes.length} meme${memes.length === 1 ? "" : "s"}`}
          </p>
        </motion.div>

        <AnimatePresence>
          {memes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card p-4 sm:p-8 rounded-xl shadow-lg border border-primary/20 text-center"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-primary-light mb-3 sm:mb-4">
                No Memes Yet
              </h2>
              <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6">
                Start sharing your favorite memes with the community!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/upload")}
                className="bg-primary hover:bg-primary-dark text-primary-foreground py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors shadow-lg shadow-primary/20 text-sm sm:text-base"
              >
                Upload Your First Meme
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {memes.map((meme, index) => (
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
                    imageUrl={meme.imageUrl}
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
