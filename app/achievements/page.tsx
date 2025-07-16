"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { AchievementService } from "@/lib/achievementService";
import { ACHIEVEMENTS } from "../../data/achievements";
import { 
  Achievement, 
  UserAchievement, 
  AchievementProgress, 
  AchievementCategory,
  ACHIEVEMENT_CATEGORY_NAMES,
  ACHIEVEMENT_CATEGORY_ICONS 
} from "../../types/achievement";
import AchievementCard from "../components/AchievementCard";

export default function AchievementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'completed' | 'progress' | 'all'>('completed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    loadAchievements();
  }, [user, router]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [achievements, progress] = await Promise.all([
        AchievementService.getUserAchievements(user.uid),
        AchievementService.getAchievementProgress(user.uid)
      ]);

      setUserAchievements(achievements);
      setAchievementProgress(progress);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };



  const filteredAchievements = ACHIEVEMENTS.filter(achievement => {
    // Category filter
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;

    // Tab filter
    const isCompleted = userAchievements.some(ua => ua.achievementId === achievement.id);
    const tabMatch = activeTab === 'all' ||
                    (activeTab === 'completed' && isCompleted) ||
                    (activeTab === 'progress' && !isCompleted);

    return categoryMatch && tabMatch;
  });

  const unlockedCount = userAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  const categories: Array<{ key: AchievementCategory | 'all', name: string, icon: string }> = [
    { key: 'all', name: 'All', icon: '🏆' },
    ...Object.entries(ACHIEVEMENT_CATEGORY_NAMES).map(([key, name]) => ({
      key: key as AchievementCategory,
      name,
      icon: ACHIEVEMENT_CATEGORY_ICONS[key as AchievementCategory]
    }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-6 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            🏆 Achievements
          </h1>
          <p className="text-text-secondary mb-6">
            Track your progress and unlock rewards
          </p>

          {/* Progress Overview */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-primary/20 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {unlockedCount}
                </div>
                <div className="text-sm text-text-secondary">
                  Achievements Unlocked
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {completionPercentage}%
                </div>
                <div className="text-sm text-text-secondary">
                  Completion Rate
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {userAchievements.filter(ua => {
                    const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
                    return achievement && ['platinum', 'diamond'].includes(achievement.tier);
                  }).length}
                </div>
                <div className="text-sm text-text-secondary">
                  Rare Achievements
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Overall Progress</span>
                <span>{unlockedCount}/{totalCount}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-3 bg-gradient-to-r from-primary to-primary-light rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-2 justify-center mb-6"
        >
          {[
            { id: 'completed', name: '✅ Completed', count: unlockedCount },
            { id: 'progress', name: '🔄 In Progress', count: ACHIEVEMENTS.length - unlockedCount },
            { id: 'all', name: '📋 All', count: ACHIEVEMENTS.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-secondary text-text-secondary hover:bg-primary/10'
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category.key
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card text-text-secondary hover:bg-card/80 border border-primary/20'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-xs opacity-70">
                  ({ACHIEVEMENTS.filter(a => category.key === 'all' || a.category === category.key).length})
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredAchievements.map((achievement, index) => {
            const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
            const progress = achievementProgress.find(p => p.achievementId === achievement.id);
            const isLocked = !userAchievement && achievement.isSecret;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <AchievementCard
                  achievement={achievement}
                  userAchievement={userAchievement}
                  progress={progress}
                  isLocked={isLocked}
                  showProgress={true}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No achievements in this category
            </h3>
            <p className="text-text-secondary">
              Try selecting a different category to see more achievements.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
