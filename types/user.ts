export interface UserProfile {
  uid: string;
  email: string;
  nickname: string;
  avatar: string;
  bio: string;
  stats: UserStats;
  isProfileComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserStats {
  memesUploaded: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  followersCount?: number;
  followingCount?: number;
  joinedAt: number;
}

export interface Avatar {
  id: string;
  name: string;
  url: string;
  category: 'animals' | 'characters' | 'abstract' | 'nature';
}

export const AVATAR_CATEGORIES = {
  animals: 'Animals',
  characters: 'Characters', 
  abstract: 'Abstract',
  nature: 'Nature'
} as const;

// Predefined avatars for users to choose from
export const AVAILABLE_AVATARS: Avatar[] = [
  // Animals
  { id: 'cat-1', name: 'Cool Cat', url: '🐱', category: 'animals' },
  { id: 'dog-1', name: 'Happy Dog', url: '🐶', category: 'animals' },
  { id: 'panda-1', name: 'Cute Panda', url: '🐼', category: 'animals' },
  { id: 'fox-1', name: 'Clever Fox', url: '🦊', category: 'animals' },
  { id: 'lion-1', name: 'Brave Lion', url: '🦁', category: 'animals' },
  { id: 'tiger-1', name: 'Strong Tiger', url: '🐯', category: 'animals' },
  { id: 'bear-1', name: 'Friendly Bear', url: '🐻', category: 'animals' },
  { id: 'koala-1', name: 'Sleepy Koala', url: '🐨', category: 'animals' },
  
  // Characters
  { id: 'robot-1', name: 'Cool Robot', url: '🤖', category: 'characters' },
  { id: 'alien-1', name: 'Space Alien', url: '👽', category: 'characters' },
  { id: 'ghost-1', name: 'Friendly Ghost', url: '👻', category: 'characters' },
  { id: 'ninja-1', name: 'Stealth Ninja', url: '🥷', category: 'characters' },
  { id: 'wizard-1', name: 'Magic Wizard', url: '🧙', category: 'characters' },
  { id: 'pirate-1', name: 'Sea Pirate', url: '🏴‍☠️', category: 'characters' },
  
  // Abstract
  { id: 'fire-1', name: 'Fire Spirit', url: '🔥', category: 'abstract' },
  { id: 'star-1', name: 'Bright Star', url: '⭐', category: 'abstract' },
  { id: 'lightning-1', name: 'Lightning Bolt', url: '⚡', category: 'abstract' },
  { id: 'diamond-1', name: 'Precious Diamond', url: '💎', category: 'abstract' },
  { id: 'rocket-1', name: 'Space Rocket', url: '🚀', category: 'abstract' },
  { id: 'crown-1', name: 'Royal Crown', url: '👑', category: 'abstract' },
  
  // Nature
  { id: 'tree-1', name: 'Wise Tree', url: '🌳', category: 'nature' },
  { id: 'flower-1', name: 'Beautiful Flower', url: '🌸', category: 'nature' },
  { id: 'sun-1', name: 'Bright Sun', url: '☀️', category: 'nature' },
  { id: 'moon-1', name: 'Night Moon', url: '🌙', category: 'nature' },
  { id: 'rainbow-1', name: 'Colorful Rainbow', url: '🌈', category: 'nature' },
  { id: 'mountain-1', name: 'Tall Mountain', url: '🏔️', category: 'nature' },
];

// Helper function to get random avatar
export const getRandomAvatar = (): Avatar => {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_AVATARS.length);
  return AVAILABLE_AVATARS[randomIndex];
};

// Helper function to get avatar by ID or return custom URL
export const getAvatarById = (id: string): Avatar | { id: string; name: string; url: string; category: 'custom' } | undefined => {
  // If it's a URL (custom avatar), return a custom avatar object
  if (id.startsWith('http')) {
    return {
      id: 'custom',
      name: 'Custom Avatar',
      url: id,
      category: 'custom' as const
    };
  }

  return AVAILABLE_AVATARS.find(avatar => avatar.id === id);
};
