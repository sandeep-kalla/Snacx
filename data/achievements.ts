import { Achievement } from '@/types/achievement';

export const ACHIEVEMENTS: Achievement[] = [
  // 📤 UPLOAD ACHIEVEMENTS
  {
    id: 'first_meme',
    name: 'First Steps',
    description: 'Upload your very first meme',
    icon: '🎬',
    category: 'upload',
    tier: 'bronze',
    criteria: {
      type: 'first_meme',
      target: 1
    }
  },
  {
    id: 'meme_creator_5',
    name: 'Getting Started',
    description: 'Have 5 active memes',
    icon: '📸',
    category: 'upload',
    tier: 'bronze',
    criteria: {
      type: 'active_memes_uploaded',
      target: 5
    }
  },
  {
    id: 'meme_creator_25',
    name: 'Content Creator',
    description: 'Have 25 active memes',
    icon: '🎥',
    category: 'upload',
    tier: 'silver',
    criteria: {
      type: 'active_memes_uploaded',
      target: 25
    }
  },
  {
    id: 'meme_creator_100',
    name: 'Meme Machine',
    description: 'Have 100 active memes',
    icon: '🏭',
    category: 'upload',
    tier: 'gold',
    criteria: {
      type: 'active_memes_uploaded',
      target: 100
    }
  },
  {
    id: 'meme_creator_500',
    name: 'Meme Legend',
    description: 'Have 500 active memes',
    icon: '👑',
    category: 'upload',
    tier: 'platinum',
    criteria: {
      type: 'active_memes_uploaded',
      target: 500
    }
  },

  // ❤️ SOCIAL ACHIEVEMENTS
  {
    id: 'first_like',
    name: 'First Fan',
    description: 'Receive your first like',
    icon: '💖',
    category: 'social',
    tier: 'bronze',
    criteria: {
      type: 'first_like',
      target: 1
    }
  },
  {
    id: 'liked_100',
    name: 'Crowd Pleaser',
    description: 'Receive 100 total likes',
    icon: '👏',
    category: 'social',
    tier: 'silver',
    criteria: {
      type: 'total_likes_received',
      target: 100
    }
  },
  {
    id: 'liked_1000',
    name: 'Fan Favorite',
    description: 'Receive 1,000 total likes',
    icon: '🌟',
    category: 'social',
    tier: 'gold',
    criteria: {
      type: 'total_likes_received',
      target: 1000
    }
  },
  {
    id: 'liked_10000',
    name: 'Meme Superstar',
    description: 'Receive 10,000 total likes',
    icon: '⭐',
    category: 'social',
    tier: 'platinum',
    criteria: {
      type: 'total_likes_received',
      target: 10000
    }
  },

  // 💬 COMMUNITY ACHIEVEMENTS
  {
    id: 'first_comment',
    name: 'Breaking the Ice',
    description: 'Make your first comment',
    icon: '💭',
    category: 'community',
    tier: 'bronze',
    criteria: {
      type: 'first_comment',
      target: 1
    }
  },
  {
    id: 'commenter_50',
    name: 'Conversationalist',
    description: 'Make 50 comments',
    icon: '🗣️',
    category: 'community',
    tier: 'silver',
    criteria: {
      type: 'comments_made',
      target: 50
    }
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Comment on 25 different users\' memes',
    icon: '🦋',
    category: 'community',
    tier: 'gold',
    criteria: {
      type: 'social_butterfly',
      target: 25
    }
  },

  // 👀 POPULARITY ACHIEVEMENTS
  {
    id: 'viral_100',
    name: 'Going Viral',
    description: 'Get 100 likes on a single meme',
    icon: '🔥',
    category: 'popularity',
    tier: 'silver',
    criteria: {
      type: 'viral_meme',
      target: 100
    }
  },
  {
    id: 'viral_500',
    name: 'Internet Famous',
    description: 'Get 500 likes on a single meme',
    icon: '🚀',
    category: 'popularity',
    tier: 'gold',
    criteria: {
      type: 'viral_meme',
      target: 500
    }
  },
  {
    id: 'viral_1000',
    name: 'Meme Phenomenon',
    description: 'Get 1,000 likes on a single meme',
    icon: '💫',
    category: 'popularity',
    tier: 'platinum',
    criteria: {
      type: 'viral_meme',
      target: 1000
    }
  },

  // ⏰ TIME-BASED ACHIEVEMENTS
  {
    id: 'consistent_7',
    name: 'Week Warrior',
    description: 'Upload memes for 7 consecutive days',
    icon: '📅',
    category: 'time',
    tier: 'silver',
    criteria: {
      type: 'consecutive_days',
      target: 7
    }
  },
  {
    id: 'consistent_30',
    name: 'Monthly Master',
    description: 'Upload memes for 30 consecutive days',
    icon: '🗓️',
    category: 'time',
    tier: 'gold',
    criteria: {
      type: 'consecutive_days',
      target: 30
    }
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Upload 10 memes between 10 PM and 2 AM',
    icon: '🦉',
    category: 'time',
    tier: 'bronze',
    criteria: {
      type: 'night_owl',
      target: 10,
      conditions: { startHour: 22, endHour: 2 }
    }
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Upload 10 memes between 5 AM and 8 AM',
    icon: '🐦',
    category: 'time',
    tier: 'bronze',
    criteria: {
      type: 'early_bird',
      target: 10,
      conditions: { startHour: 5, endHour: 8 }
    }
  },

  // 🎯 SPECIAL ACHIEVEMENTS
  {
    id: 'profile_complete',
    name: 'All Set Up',
    description: 'Complete your profile with avatar and bio',
    icon: '✅',
    category: 'special',
    tier: 'bronze',
    criteria: {
      type: 'profile_complete',
      target: 1
    }
  },
  {
    id: 'generous_heart',
    name: 'Generous Heart',
    description: 'Give 100 likes to other memes',
    icon: '💝',
    category: 'special',
    tier: 'silver',
    criteria: {
      type: 'likes_given',
      target: 100
    }
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Unlock 3 achievements in one day',
    icon: '🎯',
    category: 'special',
    tier: 'gold',
    criteria: {
      type: 'combo_master',
      target: 3,
      timeframe: 'daily'
    }
  },

  // 🏅 MILESTONE ACHIEVEMENTS
  {
    id: 'milestone_1000_likes',
    name: 'Thousand Club',
    description: 'Reach 1,000 total likes received',
    icon: '🏆',
    category: 'milestone',
    tier: 'gold',
    criteria: {
      type: 'total_likes_received',
      target: 1000
    }
  },
  {
    id: 'milestone_100_memes',
    name: 'Century Club',
    description: 'Have 100 active memes',
    icon: '💯',
    category: 'milestone',
    tier: 'gold',
    criteria: {
      type: 'active_memes_uploaded',
      target: 100
    }
  },

  // 💎 DIAMOND TIER (Ultra Rare)
  {
    id: 'meme_god',
    name: 'Meme God',
    description: 'Have 1,000 active memes',
    icon: '👑',
    category: 'upload',
    tier: 'diamond',
    criteria: {
      type: 'active_memes_uploaded',
      target: 1000
    }
  },
  {
    id: 'legend_status',
    name: 'Legend Status',
    description: 'Receive 50,000 total likes',
    icon: '🌟',
    category: 'social',
    tier: 'diamond',
    criteria: {
      type: 'total_likes_received',
      target: 50000
    }
  },

  // 👥 FOLLOWER ACHIEVEMENTS
  {
    id: 'social_connector',
    name: 'Social Connector',
    description: 'Get your first 10 followers',
    icon: '🤝',
    category: 'social',
    tier: 'bronze',
    criteria: {
      type: 'followers_count',
      target: 10
    }
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Reach 50 followers',
    icon: '👑',
    category: 'social',
    tier: 'silver',
    criteria: {
      type: 'followers_count',
      target: 50
    }
  },
  {
    id: 'mega_influencer',
    name: 'Mega Influencer',
    description: 'Reach 100 followers',
    icon: '🌟',
    category: 'social',
    tier: 'gold',
    criteria: {
      type: 'followers_count',
      target: 100
    }
  },
  {
    id: 'celebrity',
    name: 'Celebrity',
    description: 'Reach 500 followers',
    icon: '⭐',
    category: 'social',
    tier: 'platinum',
    criteria: {
      type: 'followers_count',
      target: 500
    }
  },
  {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Follow 25 users to build connections',
    icon: '🏗️',
    category: 'social',
    tier: 'bronze',
    criteria: {
      type: 'following_count',
      target: 25
    }
  },
  {
    id: 'networking_pro',
    name: 'Networking Pro',
    description: 'Follow 100 users',
    icon: '🌐',
    category: 'social',
    tier: 'silver',
    criteria: {
      type: 'following_count',
      target: 100
    }
  },
  {
    id: 'super_connector',
    name: 'Super Connector',
    description: 'Follow 250 users',
    icon: '🔗',
    category: 'social',
    tier: 'gold',
    criteria: {
      type: 'following_count',
      target: 250
    }
  }
];

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
}

export function getAchievementsByCategory(category: string): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

export function getAchievementsByTier(tier: string): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => achievement.tier === tier);
}
