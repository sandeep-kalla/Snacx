"use client";

import { motion } from "framer-motion";
import { Achievement, ACHIEVEMENT_TIER_COLORS } from "../../types/achievement";

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export default function AchievementBadge({
  achievement,
  size = 'md',
  showTooltip = true,
  className = ""
}: AchievementBadgeProps) {
  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`relative ${sizeClasses[size]} ${className}`}
      title={showTooltip ? `${achievement.name}: ${achievement.description}` : undefined}
    >
      {/* Badge Background */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center border-2 shadow-lg"
        style={{
          backgroundColor: `${tierColor}20`,
          borderColor: tierColor,
          boxShadow: `0 2px 8px ${tierColor}30`
        }}
      >
        <span className={iconSizes[size]}>
          {achievement.icon}
        </span>
      </div>

      {/* Tier Indicator */}
      {achievement.tier === 'platinum' || achievement.tier === 'diamond' ? (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white"
          style={{ backgroundColor: tierColor }}
        >
          <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">
            {achievement.tier === 'platinum' ? '💎' : '💠'}
          </span>
        </div>
      ) : null}

      {/* Glow Effect for Special Achievements */}
      {achievement.tier === 'diamond' && (
        <motion.div
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${tierColor}40 0%, transparent 70%)`
          }}
        />
      )}
    </motion.div>
  );
}
