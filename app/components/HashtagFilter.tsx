"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HashtagService } from "@/lib/hashtagService";
import { Hashtag } from "../../types/hashtag";
import HashtagChip from "./HashtagChip";

interface HashtagFilterProps {
  selectedHashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
  className?: string;
}

export default function HashtagFilter({
  selectedHashtags,
  onHashtagsChange,
  className = ""
}: HashtagFilterProps) {
  const [popularHashtags, setPopularHashtags] = useState<Hashtag[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadHashtags();
  }, []);

  const loadHashtags = async () => {
    try {
      setLoading(true);
      const [trending, popular] = await Promise.all([
        HashtagService.getTrendingHashtags(8),
        HashtagService.getPopularHashtags(12)
      ]);
      
      setTrendingHashtags(trending);
      setPopularHashtags(popular);
    } catch (error) {
      console.error("Error loading hashtags:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHashtag = (hashtag: string) => {
    if (selectedHashtags.includes(hashtag)) {
      onHashtagsChange(selectedHashtags.filter(h => h !== hashtag));
    } else {
      onHashtagsChange([...selectedHashtags, hashtag]);
    }
  };

  const clearFilters = () => {
    onHashtagsChange([]);
  };

  const displayHashtags = showAll ? popularHashtags : popularHashtags.slice(0, 8);

  if (loading) {
    return (
      <div className={`bg-card rounded-lg p-4 border border-border ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-secondary rounded w-1/3 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-secondary rounded-full w-16"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-lg p-4 border border-border ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Filter by Hashtags</h3>
        {selectedHashtags.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-accent hover:underline"
          >
            Clear all ({selectedHashtags.length})
          </button>
        )}
      </div>

      {/* Selected Hashtags */}
      <AnimatePresence>
        {selectedHashtags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20"
          >
            <div className="text-xs text-text-secondary mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {selectedHashtags.map((hashtag) => (
                <motion.div
                  key={hashtag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <HashtagChip
                    hashtag={hashtag}
                    size="sm"
                    variant="filled"
                    showEmoji={true}
                    clickable={true}
                    onClick={() => toggleHashtag(hashtag)}
                    className="bg-primary text-white hover:bg-primary/80"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-text-secondary mb-2 flex items-center">
            🔥 Trending
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((hashtag) => (
              <motion.div
                key={hashtag.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HashtagChip
                  hashtag={hashtag.name}
                  count={hashtag.count}
                  size="sm"
                  variant={selectedHashtags.includes(hashtag.name) ? "filled" : "outline"}
                  showCount={true}
                  showEmoji={true}
                  clickable={true}
                  onClick={() => toggleHashtag(hashtag.name)}
                  className={selectedHashtags.includes(hashtag.name) 
                    ? "bg-primary text-white border-primary" 
                    : "hover:border-primary/50 hover:bg-primary/5"
                  }
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Hashtags */}
      <div>
        <div className="text-xs text-text-secondary mb-2 flex items-center justify-between">
          <span>Popular</span>
          {popularHashtags.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-accent hover:underline"
            >
              {showAll ? "Show less" : `Show all (${popularHashtags.length})`}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {displayHashtags.map((hashtag, index) => (
              <motion.div
                key={hashtag.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HashtagChip
                  hashtag={hashtag.name}
                  count={hashtag.count}
                  size="sm"
                  variant={selectedHashtags.includes(hashtag.name) ? "filled" : "outline"}
                  showCount={true}
                  showEmoji={true}
                  clickable={true}
                  onClick={() => toggleHashtag(hashtag.name)}
                  className={selectedHashtags.includes(hashtag.name) 
                    ? "bg-primary text-white border-primary" 
                    : "hover:border-primary/50 hover:bg-primary/5"
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* No hashtags message */}
      {popularHashtags.length === 0 && trendingHashtags.length === 0 && (
        <div className="text-center py-4 text-text-secondary">
          <div className="text-sm">No hashtags available yet</div>
          <div className="text-xs mt-1">Start using hashtags in your posts!</div>
        </div>
      )}
    </motion.div>
  );
}
