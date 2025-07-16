"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { HashtagService } from "@/lib/hashtagService";
import { MemeService } from "@/lib/memeService";
import { Hashtag } from "../../../types/hashtag";
import { Meme } from "../../../types/meme";
import MemeCard from "../../components/MemeCard";
import HashtagChip from "../../components/HashtagChip";

export default function HashtagPage() {
  const params = useParams();
  const tag = params.tag as string;
  
  const [hashtag, setHashtag] = useState<Hashtag | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [memesLoading, setMemesLoading] = useState(true);

  useEffect(() => {
    if (tag) {
      loadHashtagData();
    }
  }, [tag]);

  const loadHashtagData = async () => {
    try {
      setLoading(true);
      setMemesLoading(true);

      // Load hashtag info
      const hashtagData = await HashtagService.getHashtag(decodeURIComponent(tag));
      setHashtag(hashtagData);

      // Load memes with this hashtag
      const memeIds = await HashtagService.getMemesByHashtag(decodeURIComponent(tag), 50);
      
      if (memeIds.length > 0) {
        const memePromises = memeIds.map(id => MemeService.getMemeById(id));
        const memeResults = await Promise.all(memePromises);
        const validMemes = memeResults.filter(meme => meme !== null) as Meme[];
        setMemes(validMemes);
      } else {
        setMemes([]);
      }
    } catch (error) {
      console.error("Error loading hashtag data:", error);
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
            <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-secondary rounded w-1/2 mb-8"></div>
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            {hashtag ? (
              <HashtagChip
                hashtag={hashtag.name}
                count={hashtag.count}
                trending={hashtag.trending}
                size="lg"
                variant="default"
                showCount={true}
                showEmoji={true}
                clickable={false}
              />
            ) : (
              <div className="px-6 py-3 bg-primary/20 rounded-full">
                <span className="text-xl font-bold text-primary">
                  #{decodeURIComponent(tag)}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            Memes tagged with #{decodeURIComponent(tag)}
          </h1>
          
          {hashtag && (
            <div className="flex items-center justify-center space-x-6 text-sm text-text-secondary">
              <span>{hashtag.count} uses</span>
              {hashtag.trending && <span className="text-accent">🔥 Trending</span>}
              <span>Category: {hashtag.category}</span>
            </div>
          )}
        </motion.div>

        {/* Memes Grid */}
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
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No memes found
            </h3>
            <p className="text-text-secondary">
              No memes have been tagged with #{decodeURIComponent(tag)} yet.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
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
                  likes={meme.likes}
                  comments={meme.comments}
                  createdAt={meme.createdAt}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

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
            ← Back to Memes
          </button>
        </motion.div>
      </div>
    </div>
  );
}
