export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  avatar: string;
  rank: number;
  score: number;
  change: number; // Position change from previous period
  level?: number;
  badge?: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
  totalUsers: number;
  lastUpdated: number;
}

export type LeaderboardType =
  | 'xp'              // Total XP points
  | 'likes'           // Total likes received
  | 'uploads'         // Total memes uploaded
  | 'comments'        // Total comments made
  | 'achievements'    // Total achievements unlocked
  | 'viral'           // Most viral memes (highest single meme likes)
  | 'consistency'     // Upload consistency score
  | 'engagement'      // Overall engagement score
  | 'followers'       // Most followers
  | 'following'       // Most following
  | 'social_score';   // Combined social engagement score

export type LeaderboardPeriod = 
  | 'all_time'
  | 'monthly'
  | 'weekly'
  | 'daily';

export const LEADERBOARD_CONFIG: Record<LeaderboardType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  scoreLabel: string;
}> = {
  xp: {
    name: 'XP Leaders',
    description: 'Top users by experience points',
    icon: '⚡',
    color: '#f59e0b',
    scoreLabel: 'XP'
  },
  likes: {
    name: 'Most Liked',
    description: 'Users with the most likes received',
    icon: '❤️',
    color: '#ef4444',
    scoreLabel: 'Likes'
  },
  uploads: {
    name: 'Top Creators',
    description: 'Most active meme creators',
    icon: '📸',
    color: '#3b82f6',
    scoreLabel: 'Memes'
  },
  comments: {
    name: 'Most Social',
    description: 'Most active commenters',
    icon: '💬',
    color: '#10b981',
    scoreLabel: 'Comments'
  },
  achievements: {
    name: 'Achievement Hunters',
    description: 'Users with the most achievements',
    icon: '🏆',
    color: '#8b5cf6',
    scoreLabel: 'Achievements'
  },
  viral: {
    name: 'Viral Champions',
    description: 'Highest single meme likes',
    icon: '🚀',
    color: '#ec4899',
    scoreLabel: 'Peak Likes'
  },
  consistency: {
    name: 'Consistency Kings',
    description: 'Most consistent uploaders',
    icon: '📅',
    color: '#06b6d4',
    scoreLabel: 'Streak'
  },
  engagement: {
    name: 'Engagement Masters',
    description: 'Highest overall engagement',
    icon: '🌟',
    color: '#f97316',
    scoreLabel: 'Score'
  },
  followers: {
    name: 'Most Followed',
    description: 'Users with the most followers',
    icon: '👥',
    color: '#6366f1',
    scoreLabel: 'Followers'
  },
  following: {
    name: 'Social Connectors',
    description: 'Users following the most people',
    icon: '🤝',
    color: '#ec4899',
    scoreLabel: 'Following'
  },
  social_score: {
    name: 'Social Champions',
    description: 'Combined social engagement score',
    icon: '🌐',
    color: '#14b8a6',
    scoreLabel: 'Social Score'
  }
};

export const LEADERBOARD_PERIODS: Record<LeaderboardPeriod, {
  name: string;
  description: string;
  days?: number;
}> = {
  all_time: {
    name: 'All Time',
    description: 'Since the beginning'
  },
  monthly: {
    name: 'This Month',
    description: 'Last 30 days',
    days: 30
  },
  weekly: {
    name: 'This Week',
    description: 'Last 7 days',
    days: 7
  },
  daily: {
    name: 'Today',
    description: 'Last 24 hours',
    days: 1
  }
};

// Utility functions
export function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

export function getRankColor(rank: number): string {
  switch (rank) {
    case 1: return '#ffd700'; // Gold
    case 2: return '#c0c0c0'; // Silver
    case 3: return '#cd7f32'; // Bronze
    default: return '#64748b'; // Gray
  }
}

export function formatScore(score: number, type: LeaderboardType): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toString();
}

export function getChangeIcon(change: number): string {
  if (change > 0) return '📈';
  if (change < 0) return '📉';
  return '➖';
}

export function getChangeColor(change: number): string {
  if (change > 0) return '#10b981'; // Green
  if (change < 0) return '#ef4444'; // Red
  return '#64748b'; // Gray
}
