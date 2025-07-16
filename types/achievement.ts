export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  criteria: AchievementCriteria;
  reward?: AchievementReward;
  isSecret?: boolean; // Hidden until unlocked
  prerequisite?: string; // Required achievement ID
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: number;
  progress?: number; // For progressive achievements
  isNew?: boolean; // For showing "NEW" badge
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  lastUpdated: number;
}

export type AchievementCategory = 
  | 'upload'      // Meme creation
  | 'social'      // Likes and engagement
  | 'community'   // Comments and interactions
  | 'popularity'  // Views and viral content
  | 'special'     // Unique accomplishments
  | 'time'        // Time-based achievements
  | 'milestone';  // Major milestones

export type AchievementTier = 
  | 'bronze'   // Easy achievements
  | 'silver'   // Medium achievements  
  | 'gold'     // Hard achievements
  | 'platinum' // Very hard achievements
  | 'diamond'  // Legendary achievements
  | 'special'; // Event/unique achievements

export interface AchievementCriteria {
  type: CriteriaType;
  target: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  conditions?: Record<string, any>;
}

export type CriteriaType =
  | 'active_memes_uploaded'    // Current active memes (decreases when deleted)
  | 'total_likes_received'     // Total likes on active memes
  | 'total_comments_received'  // Total comments on active memes
  | 'total_views_received'     // Total views on active memes
  | 'likes_given'             // Total likes given (permanent)
  | 'comments_made'           // Active comments made (decreases when deleted)
  | 'consecutive_days'        // Consecutive upload days
  | 'viral_meme'             // Meme with X likes in Y time
  | 'first_meme'             // First meme uploaded (permanent)
  | 'first_like'             // First like received (permanent)
  | 'first_comment'          // First comment made (permanent)
  | 'profile_complete'       // Profile completion (permanent)
  | 'social_butterfly'       // Comments on X different users' memes
  | 'trendsetter'           // First to use trending format
  | 'night_owl'             // Upload at specific time
  | 'early_bird'            // Upload at specific time
  | 'combo_master'          // Multiple achievements in short time
  | 'followers_count'       // Number of followers
  | 'following_count';      // Number of users following

export interface AchievementReward {
  type: 'badge' | 'title' | 'avatar_frame' | 'special_emoji';
  value: string;
  displayName: string;
}

export const ACHIEVEMENT_TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0', 
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  special: '#FF6B9D'
} as const;

export const ACHIEVEMENT_TIER_NAMES = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold', 
  platinum: 'Platinum',
  diamond: 'Diamond',
  special: 'Special'
} as const;

export const ACHIEVEMENT_CATEGORY_NAMES = {
  upload: 'Creator',
  social: 'Social',
  community: 'Community',
  popularity: 'Popular',
  special: 'Special',
  time: 'Dedication',
  milestone: 'Milestone'
} as const;

export const ACHIEVEMENT_CATEGORY_ICONS = {
  upload: '📤',
  social: '❤️',
  community: '💬',
  popularity: '👀',
  special: '🎯',
  time: '⏰',
  milestone: '🏅'
} as const;

// Achievement definitions will be in a separate file
export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  latestAchievement?: UserAchievement;
  favoriteCategory?: AchievementCategory;
  rareAchievements: number; // Platinum+ achievements
}
