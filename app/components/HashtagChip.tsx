"use client";

import { motion } from "framer-motion";
import { getHashtagColor, getHashtagEmoji, formatHashtag } from "../../types/hashtag";

interface HashtagChipProps {
  hashtag: string;
  count?: number;
  trending?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'minimal';
  clickable?: boolean;
  showCount?: boolean;
  showEmoji?: boolean;
  onClick?: (hashtag: string) => void;
  className?: string;
}

export default function HashtagChip({
  hashtag,
  count,
  trending = false,
  size = 'sm',
  variant = 'default',
  clickable = true,
  showCount = false,
  showEmoji = false,
  onClick,
  className = ""
}: HashtagChipProps) {
  const color = getHashtagColor(hashtag);
  const emoji = getHashtagEmoji(hashtag);
  const formattedTag = formatHashtag(hashtag);

  const sizeConfig = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg'
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: color,
          color: color,
          border: '1px solid'
        };
      case 'minimal':
        return {
          backgroundColor: `${color}10`,
          color: color,
          border: 'none'
        };
      default:
        return {
          backgroundColor: `${color}20`,
          borderColor: `${color}40`,
          color: color,
          border: '1px solid'
        };
    }
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(hashtag);
    }
  };

  const ChipComponent = clickable ? motion.button : motion.div;
  const motionProps = clickable ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {};

  return (
    <ChipComponent
      onClick={handleClick}
      className={`
        inline-flex items-center space-x-1 rounded-full font-medium
        ${sizeConfig[size]}
        ${clickable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
        ${className}
      `}
      style={getVariantStyles()}
      {...motionProps}
    >
      {/* Emoji */}
      {showEmoji && (
        <span className="text-sm">
          {emoji}
        </span>
      )}

      {/* Hashtag Text */}
      <span className="font-medium">
        {formattedTag}
      </span>

      {/* Count */}
      {showCount && count !== undefined && (
        <span 
          className="text-xs px-1.5 py-0.5 rounded-full font-bold"
          style={{
            backgroundColor: color,
            color: 'white'
          }}
        >
          {count > 999 ? `${Math.floor(count / 1000)}k` : count}
        </span>
      )}

      {/* Trending Indicator */}
      {trending && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs"
        >
          🔥
        </motion.span>
      )}
    </ChipComponent>
  );
}
