"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { LeaderboardService } from "@/lib/leaderboardService";
import { 
  LeaderboardData, 
  LeaderboardType, 
  LeaderboardPeriod,
  LEADERBOARD_CONFIG,
  LEADERBOARD_PERIODS,
  getRankEmoji,
  getRankColor,
  formatScore,
  getChangeIcon,
  getChangeColor
} from "../../types/leaderboard";
import { getAvatarById } from "../../types/user";
import LevelBadge from "../components/LevelBadge";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<LeaderboardType>('xp');
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('all_time');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedType, selectedPeriod, user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await LeaderboardService.getLeaderboard(
        selectedType,
        selectedPeriod,
        50,
        user?.uid
      );
      setLeaderboardData(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const config = LEADERBOARD_CONFIG[selectedType];
  const periodConfig = LEADERBOARD_PERIODS[selectedPeriod];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
            🏆 Leaderboards
          </h1>
          <p className="text-text-secondary">
            See who's leading the meme community
          </p>
        </motion.div>

        {/* Type Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(LEADERBOARD_CONFIG).map(([type, typeConfig]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type as LeaderboardType)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedType === type
                    ? 'text-white shadow-lg'
                    : 'bg-secondary text-text-secondary hover:bg-primary/10'
                }`}
                style={selectedType === type ? { backgroundColor: typeConfig.color } : {}}
              >
                {typeConfig.icon} {typeConfig.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(LEADERBOARD_PERIODS).map(([period, periodConfig]) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as LeaderboardPeriod)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-text-secondary hover:bg-primary/10'
                }`}
              >
                {periodConfig.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Current Selection Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 border border-primary/20 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <span style={{ color: config.color }}>{config.icon}</span>
                <span>{config.name}</span>
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                {config.description} • {periodConfig.description}
              </p>
            </div>
            <button
              onClick={loadLeaderboard}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </motion.div>

        {/* User's Rank */}
        {leaderboardData?.userRank && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6"
          >
            <h3 className="text-sm font-medium text-text-primary mb-2">Your Rank</h3>
            <div className="flex items-center space-x-4">
              <div 
                className="text-2xl font-bold"
                style={{ color: getRankColor(leaderboardData.userRank.rank) }}
              >
                {getRankEmoji(leaderboardData.userRank.rank)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  #{leaderboardData.userRank.rank} • {formatScore(leaderboardData.userRank.score, selectedType)} {config.scoreLabel}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-primary/20 overflow-hidden"
        >
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="w-8 h-8 bg-secondary rounded"></div>
                    <div className="w-10 h-10 bg-secondary rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-secondary rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-secondary rounded w-1/4"></div>
                    </div>
                    <div className="w-16 h-4 bg-secondary rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : leaderboardData?.entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary">No data available for this leaderboard yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {leaderboardData?.entries.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-primary/5 transition-colors ${
                    entry.userId === user?.uid ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div 
                      className="text-xl font-bold w-12 text-center"
                      style={{ color: getRankColor(entry.rank) }}
                    >
                      {getRankEmoji(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary/10 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                      {entry.avatar.startsWith('http') ? (
                        <img
                          src={entry.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {getAvatarById(entry.avatar)?.url || '🐱'}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-text-primary">
                          {entry.nickname}
                        </p>
                        {entry.level && entry.badge && (
                          <LevelBadge
                            level={{
                              level: entry.level,
                              badge: entry.badge,
                              name: '',
                              minXP: 0,
                              maxXP: 0,
                              color: config.color,
                              description: '',
                              perks: []
                            }}
                            size="xs"
                            showLevel={false}
                          />
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-bold text-text-primary">
                        {formatScore(entry.score, selectedType)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {config.scoreLabel}
                      </p>
                    </div>

                    {/* Change */}
                    {entry.change !== 0 && (
                      <div 
                        className="text-sm font-medium"
                        style={{ color: getChangeColor(entry.change) }}
                      >
                        {getChangeIcon(entry.change)} {Math.abs(entry.change)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
