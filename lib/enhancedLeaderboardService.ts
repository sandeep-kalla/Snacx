import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { UserService } from './userService';
import { FollowService } from './followService';
import { ContentCountService } from './contentCountService';

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
  category: string;
  period: string;
}

export interface LeaderboardData {
  category: string;
  period: string;
  entries: LeaderboardEntry[];
  lastUpdated: number;
}

export class EnhancedLeaderboardService {
  private static readonly LEADERBOARDS_COLLECTION = 'leaderboards';

  // Generate comprehensive leaderboards
  static async generateAllLeaderboards(): Promise<void> {
    try {
      const categories = [
        'total_likes',
        'total_comments', 
        'active_memes',
        'followers',
        'following',
        'engagement_rate',
        'viral_memes'
      ];

      const periods = ['weekly', 'monthly', 'all_time'];

      for (const category of categories) {
        for (const period of periods) {
          await this.generateLeaderboard(category, period);
        }
      }
    } catch (error) {
      console.error('Error generating all leaderboards:', error);
    }
  }

  // Generate specific leaderboard
  static async generateLeaderboard(category: string, period: string): Promise<LeaderboardData> {
    try {
      // Get all users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const entries: LeaderboardEntry[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        try {
          let score = 0;

          switch (category) {
            case 'total_likes':
              const activeStats = await ContentCountService.getUserActiveStats(userId);
              score = activeStats.totalLikes;
              break;

            case 'total_comments':
              const commentStats = await ContentCountService.getUserActiveStats(userId);
              score = commentStats.totalComments;
              break;

            case 'active_memes':
              const memeStats = await ContentCountService.getUserActiveStats(userId);
              score = memeStats.activeMemes;
              break;

            case 'followers':
              const followStats = await FollowService.getFollowStats(userId);
              score = followStats.followersCount;
              break;

            case 'following':
              const followingStats = await FollowService.getFollowStats(userId);
              score = followingStats.followingCount;
              break;

            case 'engagement_rate':
              const engagementStats = await ContentCountService.getUserActiveStats(userId);
              if (engagementStats.activeMemes > 0) {
                score = Math.round(
                  ((engagementStats.totalLikes + engagementStats.totalComments) / engagementStats.activeMemes) * 100
                ) / 100;
              }
              break;

            case 'viral_memes':
              // Count memes with 100+ likes
              const viralQuery = query(
                collection(db, 'memes'),
                where('authorId', '==', userId),
                where('likes', '>=', 100)
              );
              const viralSnapshot = await getDocs(viralQuery);
              score = viralSnapshot.size;
              break;

            default:
              score = 0;
          }

          if (score > 0) {
            entries.push({
              userId,
              nickname: userData.nickname || userData.displayName || 'Anonymous',
              avatar: userData.avatar || 'cat',
              score,
              rank: 0, // Will be set after sorting
              category,
              period
            });
          }
        } catch (error) {
          console.error(`Error calculating score for user ${userId}:`, error);
        }
      }

      // Sort by score and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Take top 100
      const topEntries = entries.slice(0, 100);

      const leaderboardData: LeaderboardData = {
        category,
        period,
        entries: topEntries,
        lastUpdated: Date.now()
      };

      // Save to Firestore
      const docId = `${category}_${period}`;
      await setDoc(doc(db, this.LEADERBOARDS_COLLECTION, docId), leaderboardData);

      return leaderboardData;
    } catch (error) {
      console.error('Error generating leaderboard:', error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(category: string, period: string): Promise<LeaderboardData | null> {
    try {
      const docId = `${category}_${period}`;
      const docRef = doc(db, this.LEADERBOARDS_COLLECTION, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as LeaderboardData;
      }
      return null;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return null;
    }
  }

  // Get user's rank in specific leaderboard
  static async getUserRank(userId: string, category: string, period: string): Promise<number | null> {
    try {
      const leaderboard = await this.getLeaderboard(category, period);
      if (!leaderboard) return null;

      const userEntry = leaderboard.entries.find(entry => entry.userId === userId);
      return userEntry ? userEntry.rank : null;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }

  // Get user's best ranks across all leaderboards
  static async getUserBestRanks(userId: string): Promise<Record<string, { rank: number; category: string; period: string }>> {
    try {
      const categories = ['total_likes', 'total_comments', 'active_memes', 'followers', 'following', 'engagement_rate', 'viral_memes'];
      const periods = ['weekly', 'monthly', 'all_time'];
      
      const bestRanks: Record<string, { rank: number; category: string; period: string }> = {};

      for (const category of categories) {
        let bestRank = Infinity;
        let bestPeriod = '';

        for (const period of periods) {
          const rank = await this.getUserRank(userId, category, period);
          if (rank && rank < bestRank) {
            bestRank = rank;
            bestPeriod = period;
          }
        }

        if (bestRank !== Infinity) {
          bestRanks[category] = {
            rank: bestRank,
            category,
            period: bestPeriod
          };
        }
      }

      return bestRanks;
    } catch (error) {
      console.error('Error getting user best ranks:', error);
      return {};
    }
  }

  // Get trending users (users with fastest growing follower count)
  static async getTrendingUsers(limitCount: number = 20): Promise<LeaderboardEntry[]> {
    try {
      // This would ideally track follower growth over time
      // For now, we'll use recent followers as a proxy
      const followersLeaderboard = await this.getLeaderboard('followers', 'weekly');
      
      if (followersLeaderboard) {
        return followersLeaderboard.entries.slice(0, limitCount);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting trending users:', error);
      return [];
    }
  }

  // Get category display info
  static getCategoryInfo(category: string): { name: string; description: string; icon: string } {
    const categoryInfo: Record<string, { name: string; description: string; icon: string }> = {
      total_likes: {
        name: 'Most Liked',
        description: 'Users with the most total likes on their memes',
        icon: '❤️'
      },
      total_comments: {
        name: 'Most Discussed',
        description: 'Users whose memes generate the most comments',
        icon: '💬'
      },
      active_memes: {
        name: 'Most Active',
        description: 'Users with the most active memes',
        icon: '📸'
      },
      followers: {
        name: 'Most Followed',
        description: 'Users with the most followers',
        icon: '👥'
      },
      following: {
        name: 'Most Social',
        description: 'Users following the most people',
        icon: '🤝'
      },
      engagement_rate: {
        name: 'Best Engagement',
        description: 'Users with the highest engagement rate per meme',
        icon: '📈'
      },
      viral_memes: {
        name: 'Viral Masters',
        description: 'Users with the most viral memes (100+ likes)',
        icon: '🔥'
      }
    };

    return categoryInfo[category] || {
      name: 'Unknown',
      description: 'Unknown category',
      icon: '❓'
    };
  }

  // Get period display info
  static getPeriodInfo(period: string): { name: string; description: string } {
    const periodInfo: Record<string, { name: string; description: string }> = {
      weekly: {
        name: 'This Week',
        description: 'Rankings for the current week'
      },
      monthly: {
        name: 'This Month', 
        description: 'Rankings for the current month'
      },
      all_time: {
        name: 'All Time',
        description: 'Rankings since the beginning'
      }
    };

    return periodInfo[period] || {
      name: 'Unknown',
      description: 'Unknown period'
    };
  }
}
