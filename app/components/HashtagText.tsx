"use client";

import { motion } from "framer-motion";
import { extractHashtags, getHashtagColor } from "../../types/hashtag";

interface HashtagTextProps {
  text: string;
  className?: string;
  onHashtagClick?: (hashtag: string) => void;
  animated?: boolean;
}

export default function HashtagText({ 
  text, 
  className = "", 
  onHashtagClick,
  animated = false 
}: HashtagTextProps) {
  
  // Split text into parts, separating hashtags
  const parseText = (inputText: string) => {
    const hashtagRegex = /#(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = hashtagRegex.exec(inputText)) !== null) {
      // Add text before hashtag
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: inputText.slice(lastIndex, match.index)
        });
      }

      // Add hashtag
      parts.push({
        type: 'hashtag',
        content: match[0], // Full hashtag with #
        hashtag: match[1]  // Just the hashtag name
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < inputText.length) {
      parts.push({
        type: 'text',
        content: inputText.slice(lastIndex)
      });
    }

    return parts;
  };

  const parts = parseText(text);

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    }
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'hashtag') {
          const color = getHashtagColor(part.hashtag);
          
          if (animated) {
            return (
              <motion.span
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleHashtagClick(part.hashtag)}
                className={`font-semibold transition-all duration-200 ${
                  onHashtagClick ? 'cursor-pointer hover:underline' : ''
                }`}
                style={{ 
                  color: color,
                  textShadow: `0 0 8px ${color}20`
                }}
              >
                {part.content}
              </motion.span>
            );
          } else {
            return (
              <span
                key={index}
                onClick={() => handleHashtagClick(part.hashtag)}
                className={`font-semibold transition-colors duration-200 ${
                  onHashtagClick ? 'cursor-pointer hover:underline hover:opacity-80' : ''
                }`}
                style={{ 
                  color: color,
                  textShadow: `0 0 4px ${color}15`
                }}
              >
                {part.content}
              </span>
            );
          }
        } else {
          return (
            <span key={index}>
              {part.content}
            </span>
          );
        }
      })}
    </span>
  );
}
