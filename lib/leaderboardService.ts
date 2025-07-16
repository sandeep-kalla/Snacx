import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserService } from './userService';
import { XPService } from './xpService';
import { AchievementService } from './achievementService';
import { ContentCountService } from './contentCountService';
import { FollowService } from './followService';
import { 
  LeaderboardEntry, 
  LeaderboardData, 
  LeaderboardType, 
  LeaderboardPeriod 
} from '../types/leaderboard';
import { getLevelByXP } from '../types/userLevel';

export class LeaderboardService {
  
  // Get leaderboard data
  static async getLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod = 'all_time',
    limitCount: number = 50,
    userId?: string
  ): Promise<LeaderboardData> {
    try {
      let entries: LeaderboardEntry[] = [];
      
      switch (type) {
        case 'xp':
          entries = await this.getXPLeaderboard(limitCount);
          break;
        case 'likes':
          entries = await this.getLikesLeaderboard(limitCount);
          break;
        case 'uploads':
          entries = await this.getUploadsLeaderboard(limitCount);
          break;
        case 'comments':
          entries = await this.getCommentsLeaderboard(limitCount);
          break;
        case 'achievements':
          entries = await this.getAchievementsLeaderboard(limitCount);
          break;
        case 'viral':
          entries = await this.getViralLeaderboard(limitCount);
          break;
        case 'consistency':
          entries = await this.getConsistencyLeaderboard(limitCount);
          break;
        case 'engagement':
          entries = await this.getEngagementLeaderboard(limitCount);
          break;
        case 'followers':
          entries = await this.getFollowersLeaderboard(limitCount);
          break;
        case 'following':
          entries = await this.getFollowingLeaderboard(limitCount);
          break;
        case 'social_score':
          entries = await this.getSocialScoreLeaderboard(limitCount);
          break;
      }

      // Find user's rank if userId provided
      let userRank: LeaderboardEntry | undefined;
      if (userId) {
        userRank = entries.find(entry => entry.userId === userId);
        if (!userRank) {
          // User not in top entries, calculate their rank
          userRank = await this.getUserRank(userId, type);
        }
      }

      return {
        entries,
        userRank,
        totalUsers: entries.length,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return {
        entries: [],
        totalUsers: 0,
        lastUpdated: Date.now()
      };
    }
  }

  // XP Leaderboard
  private static async getXPLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      const xpLeaderboard = await XPService.getXPLeaderboard(limitCount);
      const entries: LeaderboardEntry[] = [];

      for (let i = 0; i < xpLeaderboard.length; i++) {
        const xpData = xpLeaderboard[i];
        const userProfile = await UserService.getUserProfile(xpData.userId);
        
        if (userProfile) {
          const level = getLevelByXP(xpData.totalXP);
          
          entries.push({
            userId: xpData.userId,
            nickname: userProfile.nickname,
            avatar: userProfile.avatar,
            rank: i + 1,
            score: xpData.totalXP,
            change: 0, // TODO: Calculate from previous period
            level: level.level,
            badge: level.badge
          });
        }
      }

      return entries;
    } catch (error) {
      console.error('Error getting XP leaderboard:', error);
      return [];
    }
  }

  // Likes Leaderboard (Active Content Likes)
  private static async getLikesLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // Get all user profiles first
      const q = query(collection(db, 'userProfiles'), limit(limitCount * 2)); // Get more to filter
      const querySnapshot = await getDocs(q);
      const userEntries: LeaderboardEntry[] = [];

      // For each user, get their total likes on active content
      for (const doc of querySnapshot.docs) {
        const profile = doc.data();
        const totalLikesReceived = await ContentCountService.getTotalLikesReceived(doc.id);

        if (totalLikesReceived > 0) { // Only include users with likes
          userEntries.push({
            userId: doc.id,
            nickname: profile.nickname,
            avatar: profile.avatar,
            rank: 0, // Will be set after sorting
            score: totalLikesReceived,
            change: 0
          });
        }
      }

      // Sort by total likes received and assign ranks
      userEntries.sort((a, b) => b.score - a.score);
      userEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return userEntries.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting likes leaderboard:', error);
      return [];
    }
  }

  // Uploads Leaderboard (Active Memes)
  private static async getUploadsLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // Get all user profiles first
      const q = query(collection(db, 'userProfiles'), limit(limitCount * 2)); // Get more to filter
      const querySnapshot = await getDocs(q);
      const userEntries: LeaderboardEntry[] = [];

      // For each user, get their active meme count
      for (const doc of querySnapshot.docs) {
        const profile = doc.data();
        const activeMemeCount = await ContentCountService.getActiveMemeCount(doc.id);

        if (activeMemeCount > 0) { // Only include users with active memes
          userEntries.push({
            userId: doc.id,
            nickname: profile.nickname,
            avatar: profile.avatar,
            rank: 0, // Will be set after sorting
            score: activeMemeCount,
            change: 0
          });
        }
      }

      // Sort by active meme count and assign ranks
      userEntries.sort((a, b) => b.score - a.score);
      userEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return userEntries.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting uploads leaderboard:', error);
      return [];
    }
  }

  // Comments Leaderboard (Active Comments)
  private static async getCommentsLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // Get all user profiles first
      const q = query(collection(db, 'userProfiles'), limit(limitCount * 2)); // Get more to filter
      const querySnapshot = await getDocs(q);
      const userEntries: LeaderboardEntry[] = [];

      // For each user, get their active comment count
      for (const doc of querySnapshot.docs) {
        const profile = doc.data();
        const activeCommentCount = await ContentCountService.getActiveCommentCount(doc.id);

        if (activeCommentCount > 0) { // Only include users with active comments
          userEntries.push({
            userId: doc.id,
            nickname: profile.nickname,
            avatar: profile.avatar,
            rank: 0, // Will be set after sorting
            score: activeCommentCount,
            change: 0
          });
        }
      }

      // Sort by active comment count and assign ranks
      userEntries.sort((a, b) => b.score - a.score);
      userEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return userEntries.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting comments leaderboard:', error);
      return [];
    }
  }

  // Achievements Leaderboard
  private static async getAchievementsLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // This would require aggregating achievement counts
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting achievements leaderboard:', error);
      return [];
    }
  }

  // Viral Leaderboard (highest single meme likes)
  private static async getViralLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // This would require finding the highest liked meme for each user
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting viral leaderboard:', error);
      return [];
    }
  }

  // Consistency Leaderboard
  private static async getConsistencyLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // This would require calculating upload consistency scores
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting consistency leaderboard:', error);
      return [];
    }
  }

  // Engagement Leaderboard
  private static async getEngagementLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      // This would require calculating overall engagement scores
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting engagement leaderboard:', error);
      return [];
    }
  }

  // Get user's rank for a specific leaderboard type
  private static async getUserRank(userId: string, type: LeaderboardType): Promise<LeaderboardEntry | undefined> {
    try {
      const userProfile = await UserService.getUserProfile(userId);
      if (!userProfile) return undefined;

      let score = 0;
      let rank = 0;

      switch (type) {
        case 'xp':
          const userXP = await XPService.getUserXP(userId);
          score = userXP?.totalXP || 0;
          rank = await XPService.getUserRank(userId);
          break;
        case 'likes':
          score = userProfile.stats?.totalLikes || 0;
          break;
        case 'uploads':
          score = userProfile.stats?.memesUploaded || 0;
          break;
        case 'comments':
          score = userProfile.stats?.commentsMade || 0;
          break;
      }

      return {
        userId,
        nickname: userProfile.nickname,
        avatar: userProfile.avatar,
        rank,
        score,
        change: 0
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return undefined;
    }
  }

  // Followers Leaderboard
  private static async getFollowersLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      const usersQuery = query(collection(db, 'users'), limit(1000));
      const usersSnapshot = await getDocs(usersQuery);
      const entries: LeaderboardEntry[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        try {
          const followStats = await FollowService.getFollowStats(userId);

          if (followStats.followersCount > 0) {
            entries.push({
              userId,
              nickname: userData.nickname || userData.displayName || 'Anonymous',
              avatar: userData.avatar || 'cat',
              score: followStats.followersCount,
              rank: 0,
              change: 0
            });
          }
        } catch (error) {
          console.error(`Error getting follow stats for user ${userId}:`, error);
        }
      }

      // Sort by followers count and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting followers leaderboard:', error);
      return [];
    }
  }

  // Following Leaderboard
  private static async getFollowingLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      const usersQuery = query(collection(db, 'users'), limit(1000));
      const usersSnapshot = await getDocs(usersQuery);
      const entries: LeaderboardEntry[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        try {
          const followStats = await FollowService.getFollowStats(userId);

          if (followStats.followingCount > 0) {
            entries.push({
              userId,
              nickname: userData.nickname || userData.displayName || 'Anonymous',
              avatar: userData.avatar || 'cat',
              score: followStats.followingCount,
              rank: 0,
              change: 0
            });
          }
        } catch (error) {
          console.error(`Error getting follow stats for user ${userId}:`, error);
        }
      }

      // Sort by following count and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting following leaderboard:', error);
      return [];
    }
  }

  // Social Score Leaderboard (combined followers + engagement)
  private static async getSocialScoreLeaderboard(limitCount: number): Promise<LeaderboardEntry[]> {
    try {
      const usersQuery = query(collection(db, 'users'), limit(1000));
      const usersSnapshot = await getDocs(usersQuery);
      const entries: LeaderboardEntry[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        try {
          const followStats = await FollowService.getFollowStats(userId);
          const activeStats = await ContentCountService.getUserActiveStats(userId);

          // Calculate social score: followers * 2 + following * 0.5 + likes * 0.1 + comments * 0.2
          const socialScore = Math.round(
            (followStats.followersCount * 2) +
            (followStats.followingCount * 0.5) +
            (activeStats.totalLikes * 0.1) +
            (activeStats.totalComments * 0.2)
          );

          if (socialScore > 0) {
            entries.push({
              userId,
              nickname: userData.nickname || userData.displayName || 'Anonymous',
              avatar: userData.avatar || 'cat',
              score: socialScore,
              rank: 0,
              change: 0
            });
          }
        } catch (error) {
          console.error(`Error calculating social score for user ${userId}:`, error);
        }
      }

      // Sort by social score and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting social score leaderboard:', error);
      return [];
    }
  }
}
