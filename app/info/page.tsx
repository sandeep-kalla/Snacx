"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LevelBadge from "../components/LevelBadge";
import HashtagChip from "../components/HashtagChip";
import { USER_LEVELS, XP_VALUES } from "../../types/userLevel";
import { LEADERBOARD_CONFIG } from "../../types/leaderboard";
import { ACHIEVEMENTS } from "../../data/achievements";

export default function InfoPage() {
  const [activeTab, setActiveTab] = useState<'levels' | 'achievements' | 'leaderboards' | 'hashtags'>('levels');

  const tabs = [
    { id: 'levels', name: '🏆 Levels & XP', icon: '⚡' },
    { id: 'achievements', name: '🎯 Achievements', icon: '🏅' },
    { id: 'leaderboards', name: '📊 Leaderboards', icon: '👑' },
    { id: 'hashtags', name: '🏷️ Hashtags', icon: '#️⃣' }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
            📚 How It Works
          </h1>
          <p className="text-text-secondary">
            Learn about levels, achievements, leaderboards, and more!
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 justify-center mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-secondary text-text-secondary hover:bg-primary/10'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-primary/20 p-6"
        >
          {activeTab === 'levels' && <LevelsContent />}
          {activeTab === 'achievements' && <AchievementsContent />}
          {activeTab === 'leaderboards' && <LeaderboardsContent />}
          {activeTab === 'hashtags' && <HashtagsContent />}
        </motion.div>
      </div>
    </div>
  );
}

function LevelsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">⚡ Levels & XP System</h2>
        <p className="text-text-secondary mb-6">
          Earn XP (Experience Points) by being active in the community. As you gain XP, you'll level up and unlock new badges and perks!
        </p>
      </div>

      {/* XP Actions */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">💫 How to Earn XP</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(XP_VALUES).map(([action, xp]) => (
            <div key={action} className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span className="text-text-primary capitalize">
                {action.replace(/_/g, ' ')}
              </span>
              <span className="font-bold text-accent">+{xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Level Progression */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">🏆 Level Progression</h3>
        <div className="space-y-3">
          {USER_LEVELS.slice(0, 5).map((level) => (
            <div key={level.level} className="flex items-center space-x-4 p-3 bg-background rounded-lg">
              <LevelBadge level={level} size="md" showLevel={true} />
              <div className="flex-1">
                <p className="font-medium text-text-primary">{level.name}</p>
                <p className="text-sm text-text-secondary">{level.description}</p>
                <p className="text-xs text-accent">{level.minXP.toLocaleString()} - {level.maxXP.toLocaleString()} XP</p>
              </div>
            </div>
          ))}
          <div className="text-center text-text-secondary text-sm">
            ... and {USER_LEVELS.length - 5} more levels to unlock!
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementsContent() {
  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">🎯 Achievement System</h2>
        <p className="text-text-secondary mb-6">
          Unlock achievements by completing specific tasks. Some achievements track your current active content, while others are permanent milestones.
        </p>
      </div>

      {/* Achievement Types */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">🏅 Achievement Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🔒 Permanent Achievements</h4>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Earned once and never lost, even if you delete content.
            </p>
            <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
              <li>• First Steps (first meme upload)</li>
              <li>• First Fan (first like received)</li>
              <li>• Breaking the Ice (first comment)</li>
              <li>• Profile Complete</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📊 Active Achievements</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              Based on your current active content. Progress can go up or down.
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Meme counts (active memes only)</li>
              <li>• Like counts (on active memes)</li>
              <li>• Comment counts (active comments)</li>
              <li>• Social achievements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Achievement Categories */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">📂 Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {categories.map((category) => (
            <div key={category} className="p-2 bg-background rounded text-center">
              <span className="text-sm font-medium text-text-primary capitalize">
                {category.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">📊 Leaderboard System</h2>
        <p className="text-text-secondary mb-6">
          Compete with other users across different categories. All leaderboards show current active content only.
        </p>
      </div>

      {/* Leaderboard Types */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">🏆 Leaderboard Categories</h3>
        <div className="space-y-3">
          {Object.entries(LEADERBOARD_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center space-x-4 p-3 bg-background rounded-lg">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: config.color }}
              >
                {config.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">{config.name}</p>
                <p className="text-sm text-text-secondary">{config.description}</p>
              </div>
              <span className="text-xs text-accent font-medium">{config.scoreLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Important Notes</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Rankings update in real-time based on current active content</li>
          <li>• Deleted memes/comments are not counted in rankings</li>
          <li>• Your rank may change when others upload or delete content</li>
          <li>• XP leaderboard is permanent and never decreases</li>
        </ul>
      </div>
    </div>
  );
}

function HashtagsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">🏷️ Hashtag System</h2>
        <p className="text-text-secondary mb-6">
          Use hashtags in your meme titles to categorize content and help others discover your memes.
        </p>
      </div>

      {/* How to Use */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">📝 How to Use Hashtags</h3>
        <div className="space-y-3">
          <div className="p-3 bg-background rounded-lg">
            <p className="text-text-primary mb-2">1. Add hashtags to your meme titles:</p>
            <div className="p-2 bg-secondary rounded text-sm font-mono">
              "My funny cat meme #funny #cats #relatable"
            </div>
          </div>
          <div className="p-3 bg-background rounded-lg">
            <p className="text-text-primary mb-2">2. Hashtags are automatically categorized:</p>
            <div className="flex flex-wrap gap-2">
              <HashtagChip hashtag="funny" size="sm" variant="default" clickable={false} />
              <HashtagChip hashtag="cats" size="sm" variant="default" clickable={false} />
              <HashtagChip hashtag="gaming" size="sm" variant="default" clickable={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Trending System */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">🔥 Trending System</h3>
        <div className="p-4 bg-background rounded-lg">
          <ul className="space-y-2 text-text-secondary">
            <li>• Hashtags become trending when used 10+ times</li>
            <li>• Trending status considers last 7 days of activity</li>
            <li>• Popular hashtags appear on the home page</li>
            <li>• Click hashtags to filter content (coming soon)</li>
          </ul>
        </div>
      </div>

      {/* Best Practices */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Best Practices</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use 2-5 relevant hashtags per meme</li>
          <li>• Keep hashtags short and descriptive</li>
          <li>• Use popular hashtags to increase visibility</li>
          <li>• Create unique hashtags for special content</li>
        </ul>
      </div>
    </div>
  );
}
