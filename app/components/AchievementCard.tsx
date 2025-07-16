"use client";

import { motion } from "framer-motion";
import { Achievement, UserAchievement, AchievementProgress, ACHIEVEMENT_TIER_COLORS, ACHIEVEMENT_TIER_NAMES } from "../../types/achievement";

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: AchievementProgress;
  isLocked?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function AchievementCard({
  achievement,
  userAchievement,
  progress,
  isLocked = false,
  showProgress = true,
  onClick,
  className = ""
}: AchievementCardProps) {
  const isUnlocked = !!userAchievement;
  const isNew = userAchievement?.isNew;
  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];
  const progressPercentage = progress 
    ? Math.min((progress.currentValue / progress.targetValue) * 100, 100)
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative bg-card rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer ${
        isUnlocked 
          ? `border-[${tierColor}] shadow-lg shadow-[${tierColor}]/20` 
          : 'border-primary/20 hover:border-primary/40'
      } ${isLocked ? 'opacity-60' : ''} ${className}`}
      style={{
        borderColor: isUnlocked ? tierColor : undefined,
        boxShadow: isUnlocked ? `0 10px 25px ${tierColor}20` : undefined
      }}
    >
      {/* NEW Badge */}
      {isNew && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full z-10"
        >
          NEW
        </motion.div>
      )}

      {/* Tier Badge */}
      <div 
        className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: tierColor }}
      >
        {ACHIEVEMENT_TIER_NAMES[achievement.tier]}
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 text-3xl">
        {isLocked && achievement.isSecret ? '🔒' : achievement.icon}
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-foreground' : 'text-text-secondary'}`}>
          {isLocked && achievement.isSecret ? 'Secret Achievement' : achievement.name}
        </h3>
        
        <p className={`text-sm mb-3 ${isUnlocked ? 'text-text-secondary' : 'text-text-secondary/70'}`}>
          {isLocked && achievement.isSecret ? 'Complete certain actions to unlock' : achievement.description}
        </p>

        {/* Progress Bar */}
        {showProgress && progress && !isUnlocked && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>{progress.currentValue}</span>
              <span>{progress.targetValue}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-2 rounded-full"
                style={{ backgroundColor: tierColor }}
              />
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>
        )}

        {/* Unlock Date */}
        {isUnlocked && userAchievement && (
          <div className="text-xs text-text-secondary">
            Unlocked {new Date(userAchievement.unlockedAt).toLocaleDateString()}
          </div>
        )}

        {/* Reward */}
        {achievement.reward && isUnlocked && (
          <div className="mt-2 p-2 bg-primary/10 rounded-lg">
            <div className="text-xs text-primary font-medium">
              Reward: {achievement.reward.displayName}
            </div>
          </div>
        )}
      </div>

      {/* Glow Effect for Unlocked Achievements */}
      {isUnlocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${tierColor}20 0%, transparent 70%)`
          }}
        />
      )}
    </motion.div>
  );
}
