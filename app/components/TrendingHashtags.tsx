"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HashtagService } from "@/lib/hashtagService";
import { Hashtag } from "../../types/hashtag";
import HashtagChip from "./HashtagChip";

interface TrendingHashtagsProps {
  limit?: number;
  showTitle?: boolean;
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

export default function TrendingHashtags({
  limit = 10,
  showTitle = true,
  onHashtagClick,
  className = ""
}: TrendingHashtagsProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingHashtags();
  }, [limit]);

  const loadTrendingHashtags = async () => {
    try {
      setLoading(true);
      // Try to get trending hashtags first
      let trending = await HashtagService.getTrendingHashtags(limit);

      // If no trending hashtags, show recent hashtags instead
      if (trending.length === 0) {
        console.log('No trending hashtags found, showing recent hashtags');
        trending = await HashtagService.getRecentHashtags(limit);
      }

      console.log('Loaded hashtags:', trending); // Debug log
      setHashtags(trending);
    } catch (error) {
      console.error("Error loading trending hashtags:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        {showTitle && (
          <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center">
            🏷️ Popular Hashtags
          </h3>
        )}
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-secondary rounded-full px-3 py-1.5 h-8 w-20"
            />
          ))}
        </div>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className={className}>
        {showTitle && (
          <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center">
            🔥 Trending Hashtags
          </h3>
        )}
        <p className="text-text-secondary text-sm">No trending hashtags yet.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-text-primary mb-3 flex items-center"
        >
          🏷️ Popular Hashtags
        </motion.h3>
      )}

      <div className="flex flex-wrap gap-2">
        {hashtags.map((hashtag, index) => (
          <motion.div
            key={hashtag.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <HashtagChip
              hashtag={hashtag.name}
              count={hashtag.count}
              trending={hashtag.trending}
              size="sm"
              variant="default"
              showCount={true}
              showEmoji={false}
              onClick={onHashtagClick}
            />
          </motion.div>
        ))}
      </div>

      {/* Refresh Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={loadTrendingHashtags}
        className="mt-3 text-xs text-primary hover:text-primary-light transition-colors"
      >
        🔄 Refresh
      </motion.button>
    </div>
  );
}
