"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Achievement, ACHIEVEMENT_TIER_COLORS, ACHIEVEMENT_TIER_NAMES } from "../../types/achievement";
import { getAchievementById } from "../../data/achievements";

interface AchievementNotificationProps {
  achievementId: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

export default function AchievementNotification({
  achievementId,
  isVisible,
  onClose,
  autoHideDuration = 5000
}: AchievementNotificationProps) {
  const [isShowing, setIsShowing] = useState(false);
  const achievement = getAchievementById(achievementId);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  if (!achievement) return null;

  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.5 
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] max-w-sm w-full mx-4"
        >
          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-card rounded-xl p-4 shadow-2xl border-2"
            style={{ 
              borderColor: tierColor,
              boxShadow: `0 20px 40px ${tierColor}30`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                className="flex items-center space-x-2"
              >
                <span className="text-2xl">🏆</span>
                <span className="font-bold text-foreground">Achievement Unlocked!</span>
              </motion.div>
              
              <button
                onClick={() => {
                  setIsShowing(false);
                  setTimeout(onClose, 300);
                }}
                className="text-text-secondary hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Achievement Content */}
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${tierColor}20` }}
              >
                {achievement.icon}
              </motion.div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <motion.h3
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="font-bold text-lg text-foreground truncate"
                >
                  {achievement.name}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-text-secondary mb-2"
                >
                  {achievement.description}
                </motion.p>

                {/* Tier Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: tierColor }}
                >
                  <span className="mr-1">
                    {achievement.tier === 'bronze' && '🥉'}
                    {achievement.tier === 'silver' && '🥈'}
                    {achievement.tier === 'gold' && '🥇'}
                    {achievement.tier === 'platinum' && '💎'}
                    {achievement.tier === 'diamond' && '💠'}
                    {achievement.tier === 'special' && '⭐'}
                  </span>
                  {ACHIEVEMENT_TIER_NAMES[achievement.tier]}
                </motion.div>
              </div>
            </div>

            {/* Reward */}
            {achievement.reward && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-3 p-2 rounded-lg"
                style={{ backgroundColor: `${tierColor}10` }}
              >
                <div className="text-xs font-medium" style={{ color: tierColor }}>
                  🎁 Reward: {achievement.reward.displayName}
                </div>
              </motion.div>
            )}

            {/* Celebration Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: "50%",
                    y: "50%"
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: `${50 + (Math.random() - 0.5) * 150}%`,
                    y: `${50 + (Math.random() - 0.5) * 150}%`,
                  }}
                  transition={{
                    delay: 0.5 + i * 0.1,
                    duration: 1.5,
                    ease: "easeOut"
                  }}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tierColor }}
                />
              ))}
            </div>

            {/* Glow Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ 
                delay: 0.3,
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${tierColor}20 0%, transparent 70%)`
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
