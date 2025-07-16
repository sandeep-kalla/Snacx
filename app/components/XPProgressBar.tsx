"use client";

import { motion } from "framer-motion";
import { UserLevel, getLevelByXP, getNextLevel, calculateLevelProgress } from "@/types/userLevel";

interface XPProgressBarProps {
  currentXP: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export default function XPProgressBar({
  currentXP,
  showDetails = true,
  size = 'md',
  animated = true,
  className = ""
}: XPProgressBarProps) {
  const currentLevel = getLevelByXP(currentXP);
  const nextLevel = getNextLevel(currentLevel.level);
  const progress = calculateLevelProgress(currentXP);
  const xpInCurrentLevel = currentXP - currentLevel.minXP;
  const xpNeededForLevel = currentLevel.maxXP - currentLevel.minXP + 1;
  const xpToNext = nextLevel ? nextLevel.minXP - currentXP : 0;

  const sizeConfig = {
    sm: {
      height: 'h-2',
      text: 'text-xs',
      spacing: 'space-y-1'
    },
    md: {
      height: 'h-3',
      text: 'text-sm',
      spacing: 'space-y-2'
    },
    lg: {
      height: 'h-4',
      text: 'text-base',
      spacing: 'space-y-3'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`${config.spacing} ${className}`}>
      {/* Level Info */}
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span 
              className={`font-bold ${config.text}`}
              style={{ color: currentLevel.color }}
            >
              Level {currentLevel.level}
            </span>
            <span className={`text-text-secondary ${config.text}`}>
              {currentLevel.name}
            </span>
          </div>
          
          <div className={`text-text-secondary ${config.text}`}>
            {currentXP.toLocaleString()} XP
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative">
        {/* Background */}
        <div 
          className={`w-full ${config.height} bg-secondary rounded-full overflow-hidden border border-primary/10`}
        >
          {/* Progress Fill */}
          <motion.div
            className={`${config.height} rounded-full relative overflow-hidden`}
            style={{
              background: `linear-gradient(90deg, ${currentLevel.color}80 0%, ${currentLevel.color} 100%)`,
              width: `${progress}%`
            }}
            initial={animated ? { width: 0 } : undefined}
            animate={animated ? { width: `${progress}%` } : undefined}
            transition={animated ? { duration: 1, ease: "easeOut" } : undefined}
          >
            {/* Shine Effect */}
            {animated && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>
        </div>

        {/* Progress Percentage */}
        {progress > 15 && (
          <div 
            className={`absolute inset-0 flex items-center justify-center ${config.text} font-medium text-white drop-shadow-sm`}
          >
            {Math.round(progress)}%
          </div>
        )}
      </div>

      {/* XP Details */}
      {showDetails && (
        <div className="flex items-center justify-between">
          <span className={`text-text-secondary ${config.text}`}>
            {xpInCurrentLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP
          </span>
          
          {nextLevel ? (
            <span className={`text-text-secondary ${config.text}`}>
              {xpToNext.toLocaleString()} XP to {nextLevel.name}
            </span>
          ) : (
            <span 
              className={`font-bold ${config.text}`}
              style={{ color: currentLevel.color }}
            >
              MAX LEVEL!
            </span>
          )}
        </div>
      )}

      {/* Next Level Preview */}
      {nextLevel && showDetails && (
        <div className="flex items-center space-x-2 pt-1">
          <span className={`text-text-secondary ${config.text}`}>
            Next:
          </span>
          <span 
            className={`font-medium ${config.text}`}
            style={{ color: nextLevel.color }}
          >
            {nextLevel.badge} {nextLevel.name}
          </span>
        </div>
      )}
    </div>
  );
}
