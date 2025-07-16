"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AchievementService } from "@/lib/achievementService";
import { ACHIEVEMENTS, getAchievementById } from "../../data/achievements";
import { UserAchievement, AchievementStats } from "../../types/achievement";
import AchievementBadge from "./AchievementBadge";
import BadgeExplanationModal from "./BadgeExplanationModal";
import Link from "next/link";

interface AchievementSummaryProps {
  userId: string;
  showTitle?: boolean;
  maxBadges?: number;
  className?: string;
}

export default function AchievementSummary({
  userId,
  showTitle = true,
  maxBadges = 5,
  className = ""
}: AchievementSummaryProps) {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [achievements, achievementStats] = await Promise.all([
        AchievementService.getUserAchievements(userId),
        AchievementService.getAchievementStats(userId)
      ]);

      setUserAchievements(achievements);
      setStats(achievementStats);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-secondary rounded w-24 mb-2"></div>
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-secondary rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || userAchievements.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Achievements
          </h3>
        )}
        <p className="text-xs text-text-secondary">No achievements yet</p>
      </div>
    );
  }

  // Sort achievements by tier (rarest first) and date
  const sortedAchievements = userAchievements
    .map(ua => ({
      ...ua,
      achievement: getAchievementById(ua.achievementId)
    }))
    .filter(ua => ua.achievement)
    .sort((a, b) => {
      const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1, special: 6 };
      const aTier = tierOrder[a.achievement!.tier];
      const bTier = tierOrder[b.achievement!.tier];
      
      if (aTier !== bTier) {
        return bTier - aTier; // Highest tier first
      }
      
      return b.unlockedAt - a.unlockedAt; // Most recent first
    })
    .slice(0, maxBadges);

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">
            Achievements
          </h3>
          <Link 
            href="/achievements"
            className="text-xs text-primary hover:text-primary-light transition-colors"
          >
            View All ({stats.unlockedAchievements})
          </Link>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {/* Achievement Badges */}
        <div className="flex space-x-1">
          {sortedAchievements.map((ua, index) => (
            <motion.div
              key={ua.achievementId}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="cursor-pointer"
              onClick={() => {
                setSelectedBadgeId(ua.achievementId);
                setShowBadgeModal(true);
              }}
            >
              <AchievementBadge
                achievement={ua.achievement!}
                size="sm"
                showTooltip={true}
              />
            </motion.div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="flex items-center space-x-3 text-xs text-text-secondary">
          <div className="flex items-center space-x-1">
            <span>🏆</span>
            <span>{stats.unlockedAchievements}/{stats.totalAchievements}</span>
          </div>
          
          {stats.rareAchievements > 0 && (
            <div className="flex items-center space-x-1">
              <span>💎</span>
              <span>{stats.rareAchievements}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <span>{stats.completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Latest Achievement */}
      {stats.latestAchievement && (
        <div className="mt-2 text-xs text-text-secondary">
          Latest: {getAchievementById(stats.latestAchievement.achievementId)?.name}
          {stats.latestAchievement.isNew && (
            <span className="ml-1 px-1 py-0.5 bg-accent text-white rounded text-xs font-bold">
              NEW
            </span>
          )}
        </div>
      )}

      {/* Badge Explanation Modal */}
      <BadgeExplanationModal
        isOpen={showBadgeModal}
        onClose={() => {
          setShowBadgeModal(false);
          setSelectedBadgeId(null);
        }}
        badgeId={selectedBadgeId || undefined}
      />
    </div>
  );
}
