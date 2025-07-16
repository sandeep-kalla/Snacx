export interface Hashtag {
  id: string;
  name: string; // without the # symbol
  count: number; // number of memes using this hashtag
  trending: boolean;
  createdAt: number;
  lastUsed: number;
  category?: HashtagCategory;
}

export interface HashtagStats {
  totalHashtags: number;
  trendingHashtags: number;
  topHashtags: Hashtag[];
  recentHashtags: Hashtag[];
}

export interface MemeHashtag {
  memeId: string;
  hashtags: string[]; // array of hashtag names (without #)
  createdAt: number;
}

export type HashtagCategory = 
  | 'funny'
  | 'relatable'
  | 'trending'
  | 'viral'
  | 'wholesome'
  | 'dark'
  | 'gaming'
  | 'anime'
  | 'movies'
  | 'music'
  | 'sports'
  | 'tech'
  | 'food'
  | 'travel'
  | 'lifestyle'
  | 'memes'
  | 'random';

export const HASHTAG_CATEGORIES: Record<HashtagCategory, { name: string; emoji: string; color: string }> = {
  funny: { name: 'Funny', emoji: '😂', color: '#f59e0b' },
  relatable: { name: 'Relatable', emoji: '😅', color: '#3b82f6' },
  trending: { name: 'Trending', emoji: '🔥', color: '#ef4444' },
  viral: { name: 'Viral', emoji: '🚀', color: '#8b5cf6' },
  wholesome: { name: 'Wholesome', emoji: '🥰', color: '#10b981' },
  dark: { name: 'Dark Humor', emoji: '🖤', color: '#6b7280' },
  gaming: { name: 'Gaming', emoji: '🎮', color: '#06b6d4' },
  anime: { name: 'Anime', emoji: '🍜', color: '#f97316' },
  movies: { name: 'Movies', emoji: '🎬', color: '#7c3aed' },
  music: { name: 'Music', emoji: '🎵', color: '#ec4899' },
  sports: { name: 'Sports', emoji: '⚽', color: '#22c55e' },
  tech: { name: 'Tech', emoji: '💻', color: '#0ea5e9' },
  food: { name: 'Food', emoji: '🍕', color: '#f97316' },
  travel: { name: 'Travel', emoji: '✈️', color: '#06b6d4' },
  lifestyle: { name: 'Lifestyle', emoji: '✨', color: '#a855f7' },
  memes: { name: 'Memes', emoji: '🤣', color: '#eab308' },
  random: { name: 'Random', emoji: '🎲', color: '#64748b' }
};

export const TRENDING_HASHTAGS = [
  'funny', 'meme', 'lol', 'relatable', 'mood', 'viral', 'trending', 'comedy',
  'humor', 'life', 'work', 'school', 'weekend', 'monday', 'coffee', 'food',
  'gaming', 'anime', 'movies', 'music', 'sports', 'tech', 'programming',
  'wholesome', 'cute', 'pets', 'cats', 'dogs', 'love', 'friendship'
];

// Utility functions
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

export function formatHashtag(hashtag: string): string {
  return `#${hashtag}`;
}

export function isValidHashtag(hashtag: string): boolean {
  // Hashtag should be 1-30 characters, alphanumeric and underscores only
  const regex = /^[a-zA-Z0-9_]{1,30}$/;
  return regex.test(hashtag);
}

export function categorizeHashtag(hashtag: string): HashtagCategory {
  const lowerTag = hashtag.toLowerCase();
  
  // Check for category keywords
  if (['funny', 'lol', 'comedy', 'humor', 'hilarious'].some(word => lowerTag.includes(word))) {
    return 'funny';
  }
  if (['relatable', 'mood', 'me', 'life', 'real'].some(word => lowerTag.includes(word))) {
    return 'relatable';
  }
  if (['viral', 'trending', 'hot', 'popular'].some(word => lowerTag.includes(word))) {
    return 'trending';
  }
  if (['wholesome', 'cute', 'sweet', 'love', 'heart'].some(word => lowerTag.includes(word))) {
    return 'wholesome';
  }
  if (['dark', 'cursed', 'evil', 'devil'].some(word => lowerTag.includes(word))) {
    return 'dark';
  }
  if (['gaming', 'game', 'gamer', 'xbox', 'playstation', 'pc', 'nintendo'].some(word => lowerTag.includes(word))) {
    return 'gaming';
  }
  if (['anime', 'manga', 'otaku', 'weeb', 'japan'].some(word => lowerTag.includes(word))) {
    return 'anime';
  }
  if (['movie', 'film', 'cinema', 'hollywood', 'actor'].some(word => lowerTag.includes(word))) {
    return 'movies';
  }
  if (['music', 'song', 'band', 'artist', 'concert'].some(word => lowerTag.includes(word))) {
    return 'music';
  }
  if (['sport', 'football', 'basketball', 'soccer', 'tennis', 'gym'].some(word => lowerTag.includes(word))) {
    return 'sports';
  }
  if (['tech', 'technology', 'programming', 'code', 'developer', 'computer'].some(word => lowerTag.includes(word))) {
    return 'tech';
  }
  if (['food', 'cooking', 'recipe', 'restaurant', 'eat'].some(word => lowerTag.includes(word))) {
    return 'food';
  }
  if (['travel', 'vacation', 'trip', 'adventure', 'explore'].some(word => lowerTag.includes(word))) {
    return 'travel';
  }
  if (['lifestyle', 'fashion', 'style', 'beauty', 'health'].some(word => lowerTag.includes(word))) {
    return 'lifestyle';
  }
  if (['meme', 'memes', 'memeing'].some(word => lowerTag.includes(word))) {
    return 'memes';
  }
  
  return 'random';
}

export function getHashtagColor(hashtag: string): string {
  const category = categorizeHashtag(hashtag);
  return HASHTAG_CATEGORIES[category].color;
}

export function getHashtagEmoji(hashtag: string): string {
  const category = categorizeHashtag(hashtag);
  return HASHTAG_CATEGORIES[category].emoji;
}
