import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

export interface BadgeExplanation {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'level' | 'achievement' | 'special';
  requirements: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpValue?: number;
  levelRequired?: number;
  color: string;
  gradient?: string;
}

export class BadgeExplanationService {
  private static readonly BADGE_EXPLANATIONS_COLLECTION = 'badgeExplanations';

  // Initialize default badge explanations
  static async initializeBadgeExplanations(): Promise<void> {
    try {
      const defaultBadges: BadgeExplanation[] = [
        // Level Badges
        {
          id: 'level_1',
          name: 'Meme Newbie',
          description: 'Welcome to the meme community! You\'ve just started your journey.',
          icon: '🐣',
          category: 'level',
          requirements: 'Reach Level 1 (0-99 XP)',
          rarity: 'common',
          xpValue: 0,
          levelRequired: 1,
          color: '#10B981',
          gradient: 'from-green-400 to-green-600'
        },
        {
          id: 'level_2',
          name: 'Casual Creator',
          description: 'You\'re getting the hang of this! Keep creating and engaging.',
          icon: '😊',
          category: 'level',
          requirements: 'Reach Level 2 (100-249 XP)',
          rarity: 'common',
          xpValue: 100,
          levelRequired: 2,
          color: '#3B82F6',
          gradient: 'from-blue-400 to-blue-600'
        },
        {
          id: 'level_3',
          name: 'Meme Enthusiast',
          description: 'Your passion for memes is showing! You\'re becoming a regular.',
          icon: '🎯',
          category: 'level',
          requirements: 'Reach Level 3 (250-499 XP)',
          rarity: 'common',
          xpValue: 250,
          levelRequired: 3,
          color: '#8B5CF6',
          gradient: 'from-purple-400 to-purple-600'
        },
        {
          id: 'level_4',
          name: 'Content Curator',
          description: 'You have a good eye for quality content and know what makes people laugh.',
          icon: '🎨',
          category: 'level',
          requirements: 'Reach Level 4 (500-999 XP)',
          rarity: 'rare',
          xpValue: 500,
          levelRequired: 4,
          color: '#F59E0B',
          gradient: 'from-yellow-400 to-orange-500'
        },
        {
          id: 'level_5',
          name: 'Meme Master',
          description: 'You\'ve mastered the art of memes! Your content consistently entertains.',
          icon: '🏆',
          category: 'level',
          requirements: 'Reach Level 5 (1000-1999 XP)',
          rarity: 'epic',
          xpValue: 1000,
          levelRequired: 5,
          color: '#EF4444',
          gradient: 'from-red-400 to-red-600'
        },
        {
          id: 'level_6',
          name: 'Viral Virtuoso',
          description: 'Your memes spread like wildfire! You understand internet culture deeply.',
          icon: '🚀',
          category: 'level',
          requirements: 'Reach Level 6 (2000+ XP)',
          rarity: 'legendary',
          xpValue: 2000,
          levelRequired: 6,
          color: '#EC4899',
          gradient: 'from-pink-400 to-pink-600'
        },

        // Achievement Badges
        {
          id: 'first_meme',
          name: 'First Steps',
          description: 'Congratulations on uploading your very first meme!',
          icon: '🎬',
          category: 'achievement',
          requirements: 'Upload your first meme',
          rarity: 'common',
          color: '#10B981'
        },
        {
          id: 'first_comment',
          name: 'Breaking the Ice',
          description: 'You love connecting with others! You\'ve made your first comment.',
          icon: '💭',
          category: 'achievement',
          requirements: 'Post your first comment',
          rarity: 'common',
          color: '#3B82F6'
        },
        {
          id: 'first_like',
          name: 'First Fan',
          description: 'Your meme made people smile! You received your first like.',
          icon: '💖',
          category: 'achievement',
          requirements: 'Receive your first like',
          rarity: 'common',
          color: '#F59E0B'
        },
        {
          id: 'liked_100',
          name: 'Crowd Pleaser',
          description: 'You\'re gaining recognition! You\'ve received 100+ total likes.',
          icon: '👏',
          category: 'achievement',
          requirements: 'Receive 100+ total likes',
          rarity: 'rare',
          color: '#8B5CF6'
        },
        {
          id: 'viral_100',
          name: 'Going Viral',
          description: 'Internet fame! Your meme went viral with 100+ likes.',
          icon: '🔥',
          category: 'achievement',
          requirements: 'Get 100+ likes on a single meme',
          rarity: 'epic',
          color: '#EF4444'
        },
        {
          id: 'social_butterfly',
          name: 'Social Butterfly',
          description: 'Your content sparks discussions! You comment on many different users\' memes.',
          icon: '🦋',
          category: 'achievement',
          requirements: 'Comment on 25 different users\' memes',
          rarity: 'rare',
          color: '#06B6D4'
        },
        {
          id: 'meme_creator_5',
          name: 'Getting Started',
          description: 'You\'re on a roll! You\'ve got 5 active memes.',
          icon: '📸',
          category: 'achievement',
          requirements: 'Have 5 active memes',
          rarity: 'rare',
          color: '#84CC16'
        },
        {
          id: 'meme_creator_100',
          name: 'Meme Machine',
          description: 'Unstoppable creativity! You\'ve got 100 active memes.',
          icon: '🏭',
          category: 'achievement',
          requirements: 'Have 100 active memes',
          rarity: 'epic',
          color: '#A855F7'
        },
        {
          id: 'liked_1000',
          name: 'Fan Favorite',
          description: 'The community loves your content! You\'ve received 1,000+ total likes.',
          icon: '🌟',
          category: 'achievement',
          requirements: 'Receive 1,000+ total likes',
          rarity: 'epic',
          color: '#F43F5E'
        },
        {
          id: 'social_connector',
          name: 'Social Connector',
          description: 'You\'re building a network! You have 10+ followers.',
          icon: '🤝',
          category: 'achievement',
          requirements: 'Get 10+ followers',
          rarity: 'rare',
          color: '#0EA5E9'
        },
        {
          id: 'influencer',
          name: 'Influencer',
          description: 'You\'re a true influencer! You have 50+ followers.',
          icon: '👑',
          category: 'achievement',
          requirements: 'Get 50+ followers',
          rarity: 'legendary',
          color: '#FBBF24'
        },

        // Special Badges
        {
          id: 'early_adopter',
          name: 'Early Adopter',
          description: 'You were here from the beginning! Thanks for being an early member.',
          icon: '🌟',
          category: 'special',
          requirements: 'Join during beta period',
          rarity: 'legendary',
          color: '#6366F1'
        },
        {
          id: 'beta_tester',
          name: 'Beta Tester',
          description: 'You helped shape this platform! Thanks for testing new features.',
          icon: '🧪',
          category: 'special',
          requirements: 'Participate in beta testing',
          rarity: 'epic',
          color: '#10B981'
        }
      ];

      // Save each badge explanation
      for (const badge of defaultBadges) {
        await setDoc(doc(db, this.BADGE_EXPLANATIONS_COLLECTION, badge.id), badge);
      }

      console.log('Badge explanations initialized successfully');
    } catch (error) {
      console.error('Error initializing badge explanations:', error);
    }
  }

  // Get badge explanation by ID
  static async getBadgeExplanation(badgeId: string): Promise<BadgeExplanation | null> {
    try {
      const badgeRef = doc(db, this.BADGE_EXPLANATIONS_COLLECTION, badgeId);
      const badgeDoc = await getDoc(badgeRef);

      if (badgeDoc.exists()) {
        return badgeDoc.data() as BadgeExplanation;
      }
      return null;
    } catch (error) {
      console.error('Error getting badge explanation:', error);
      return null;
    }
  }

  // Get all badge explanations
  static async getAllBadgeExplanations(): Promise<BadgeExplanation[]> {
    try {
      const q = query(
        collection(db, this.BADGE_EXPLANATIONS_COLLECTION),
        orderBy('category'),
        orderBy('levelRequired')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as BadgeExplanation);
    } catch (error) {
      console.error('Error getting all badge explanations:', error);
      return [];
    }
  }

  // Get badge explanations by category
  static async getBadgesByCategory(category: 'level' | 'achievement' | 'special'): Promise<BadgeExplanation[]> {
    try {
      const q = query(
        collection(db, this.BADGE_EXPLANATIONS_COLLECTION),
        orderBy('levelRequired')
      );

      const querySnapshot = await getDocs(q);
      const allBadges = querySnapshot.docs.map(doc => doc.data() as BadgeExplanation);
      
      return allBadges.filter(badge => badge.category === category);
    } catch (error) {
      console.error('Error getting badges by category:', error);
      return [];
    }
  }

  // Get level badge for specific level
  static async getLevelBadge(level: number): Promise<BadgeExplanation | null> {
    try {
      const levelBadges = await this.getBadgesByCategory('level');
      return levelBadges.find(badge => badge.levelRequired === level) || null;
    } catch (error) {
      console.error('Error getting level badge:', error);
      return null;
    }
  }
}
