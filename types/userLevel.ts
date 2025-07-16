export interface UserLevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  badge: string;
  color: string;
  description: string;
  perks: string[];
}

export interface UserXP {
  userId: string;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  lastUpdated: number;
  xpHistory: XPTransaction[];
}

export interface XPTransaction {
  id: string;
  action: XPAction;
  amount: number;
  timestamp: number;
  description: string;
  metadata?: Record<string, any>;
}

export type XPAction = 
  | 'meme_upload'           // +10 XP
  | 'meme_like_received'    // +2 XP
  | 'meme_like_given'       // +1 XP
  | 'comment_made'          // +3 XP
  | 'comment_received'      // +2 XP
  | 'achievement_unlocked'  // +5-50 XP based on tier
  | 'daily_login'           // +5 XP
  | 'profile_complete'      // +20 XP
  | 'viral_meme'           // +25 XP (100+ likes)
  | 'trending_meme'        // +15 XP (top 10 trending)
  | 'social_butterfly'     // +10 XP (comment on 5 different users)
  | 'consistency_bonus'    // +20 XP (upload for 7 days straight)
  | 'quality_content'      // +30 XP (meme gets 500+ likes)
  | 'community_favorite';  // +40 XP (meme gets 1000+ likes)

export const XP_VALUES: Record<XPAction, number> = {
  meme_upload: 10,
  meme_like_received: 2,
  meme_like_given: 1,
  comment_made: 3,
  comment_received: 2,
  achievement_unlocked: 15, // Base value, varies by tier
  daily_login: 5,
  profile_complete: 20,
  viral_meme: 25,
  trending_meme: 15,
  social_butterfly: 10,
  consistency_bonus: 20,
  quality_content: 30,
  community_favorite: 40
};

export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    name: "Meme Newbie",
    minXP: 0,
    maxXP: 99,
    badge: "🐣",
    color: "#94a3b8",
    description: "Just getting started!",
    perks: ["Welcome to the community!"]
  },
  {
    level: 2,
    name: "Casual Creator",
    minXP: 100,
    maxXP: 249,
    badge: "😊",
    color: "#22c55e",
    description: "Learning the ropes",
    perks: ["Can use basic reactions"]
  },
  {
    level: 3,
    name: "Meme Enthusiast",
    minXP: 250,
    maxXP: 499,
    badge: "😎",
    color: "#3b82f6",
    description: "Getting the hang of it",
    perks: ["Can create custom hashtags"]
  },
  {
    level: 4,
    name: "Content Creator",
    minXP: 500,
    maxXP: 999,
    badge: "🎨",
    color: "#8b5cf6",
    description: "Making quality content",
    perks: ["Priority in trending", "Custom profile themes"]
  },
  {
    level: 5,
    name: "Meme Master",
    minXP: 1000,
    maxXP: 1999,
    badge: "🏆",
    color: "#f59e0b",
    description: "Skilled meme creator",
    perks: ["Featured creator badge", "Early access to features"]
  },
  {
    level: 6,
    name: "Viral Virtuoso",
    minXP: 2000,
    maxXP: 3999,
    badge: "🌟",
    color: "#ef4444",
    description: "Creates viral content",
    perks: ["Verified creator status", "Custom emoji reactions"]
  },
  {
    level: 7,
    name: "Meme Legend",
    minXP: 4000,
    maxXP: 7999,
    badge: "👑",
    color: "#dc2626",
    description: "Community favorite",
    perks: ["Legend badge", "Exclusive features", "Community events access"]
  },
  {
    level: 8,
    name: "Meme God",
    minXP: 8000,
    maxXP: 15999,
    badge: "⚡",
    color: "#7c3aed",
    description: "Legendary status",
    perks: ["God tier badge", "All features unlocked", "Special recognition"]
  },
  {
    level: 9,
    name: "Meme Deity",
    minXP: 16000,
    maxXP: 31999,
    badge: "🔥",
    color: "#be185d",
    description: "Beyond legendary",
    perks: ["Deity status", "Influence on app features", "Hall of fame"]
  },
  {
    level: 10,
    name: "Meme Overlord",
    minXP: 32000,
    maxXP: 999999,
    badge: "💎",
    color: "#059669",
    description: "The ultimate memer",
    perks: ["Overlord status", "Shape the community", "Eternal recognition"]
  }
];

export function getLevelByXP(xp: number): UserLevel {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= USER_LEVELS[i].minXP) {
      return USER_LEVELS[i];
    }
  }
  return USER_LEVELS[0];
}

export function getNextLevel(currentLevel: number): UserLevel | null {
  if (currentLevel >= USER_LEVELS.length) {
    return null;
  }
  return USER_LEVELS[currentLevel];
}

export function calculateXPToNextLevel(currentXP: number): number {
  const currentLevel = getLevelByXP(currentXP);
  const nextLevel = getNextLevel(currentLevel.level);
  
  if (!nextLevel) {
    return 0; // Max level reached
  }
  
  return nextLevel.minXP - currentXP;
}

export function calculateLevelProgress(currentXP: number): number {
  const currentLevel = getLevelByXP(currentXP);
  const levelXP = currentXP - currentLevel.minXP;
  const levelRange = currentLevel.maxXP - currentLevel.minXP + 1;
  
  return Math.min(100, (levelXP / levelRange) * 100);
}
