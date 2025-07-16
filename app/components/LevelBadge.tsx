"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserLevel, getLevelByXP } from "@/types/userLevel";
import BadgeExplanationModal from "./BadgeExplanationModal";

interface LevelBadgeProps {
  level?: UserLevel;
  xp?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
  showName?: boolean;
  showXP?: boolean;
  animated?: boolean;
  className?: string;
}

export default function LevelBadge({
  level,
  xp,
  size = 'md',
  showLevel = true,
  showName = false,
  showXP = false,
  animated = true,
  className = ""
}: LevelBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  // If XP is provided but no level, calculate level from XP
  const displayLevel = level || (xp !== undefined ? getLevelByXP(xp) : null);
  
  if (!displayLevel) return null;

  const sizeConfig = {
    xs: {
      container: 'w-6 h-6',
      badge: 'text-xs',
      text: 'text-xs',
      spacing: 'space-x-1'
    },
    sm: {
      container: 'w-8 h-8',
      badge: 'text-sm',
      text: 'text-xs',
      spacing: 'space-x-1'
    },
    md: {
      container: 'w-10 h-10',
      badge: 'text-base',
      text: 'text-sm',
      spacing: 'space-x-2'
    },
    lg: {
      container: 'w-12 h-12',
      badge: 'text-lg',
      text: 'text-base',
      spacing: 'space-x-2'
    },
    xl: {
      container: 'w-16 h-16',
      badge: 'text-2xl',
      text: 'text-lg',
      spacing: 'space-x-3'
    }
  };

  const config = sizeConfig[size];

  const BadgeComponent = animated ? motion.div : 'div';
  const badgeProps = animated ? {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: "spring", stiffness: 300, damping: 20 }
  } : {};

  return (
    <div className={`flex items-center ${config.spacing} ${className}`}>
      {/* Level Badge */}
      <BadgeComponent
        {...badgeProps}
        onClick={() => setShowModal(true)}
        className={`${config.container} rounded-full flex items-center justify-center font-bold shadow-lg border-2 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform`}
        style={{
          backgroundColor: `${displayLevel.color}20`,
          borderColor: displayLevel.color,
          boxShadow: `0 2px 8px ${displayLevel.color}30`
        }}
        title={`${displayLevel.name} - Level ${displayLevel.level} (Click for details)`}
      >
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${displayLevel.color}40 0%, ${displayLevel.color}10 100%)`
          }}
        />
        
        {/* Badge Emoji/Icon */}
        <span className={`${config.badge} relative z-10`}>
          {displayLevel.badge}
        </span>

        {/* Level Number Overlay */}
        {showLevel && (
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white"
            style={{ backgroundColor: displayLevel.color }}
          >
            {displayLevel.level}
          </div>
        )}

        {/* Glow Effect for High Levels */}
        {displayLevel.level >= 7 && animated && (
          <motion.div
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${displayLevel.color}60 0%, transparent 70%)`
            }}
          />
        )}
      </BadgeComponent>

      {/* Level Info */}
      {(showName || showXP) && (
        <div className="flex flex-col">
          {showName && (
            <span 
              className={`font-medium ${config.text}`}
              style={{ color: displayLevel.color }}
            >
              {displayLevel.name}
            </span>
          )}
          {showXP && xp !== undefined && (
            <span className={`text-text-secondary ${config.text}`}>
              {xp.toLocaleString()} XP
            </span>
          )}
        </div>
      )}

      {/* Badge Explanation Modal */}
      <BadgeExplanationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        badgeId={`level_${displayLevel.level}`}
      />
    </div>
  );
}
