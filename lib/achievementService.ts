import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Achievement, 
  UserAchievement, 
  AchievementProgress, 
  AchievementStats,
  CriteriaType 
} from '../types/achievement';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievements';
import { UserService } from './userService';
import { ContentCountService } from './contentCountService';
import { FollowService } from './followService';

export class AchievementService {
  private static readonly USER_ACHIEVEMENTS_COLLECTION = 'userAchievements';
  private static readonly ACHIEVEMENT_PROGRESS_COLLECTION = 'achievementProgress';

  // Get user's unlocked achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const docRef = doc(db, this.USER_ACHIEVEMENTS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().achievements || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Get user's achievement progress
  static async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    try {
      const docRef = doc(db, this.ACHIEVEMENT_PROGRESS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().progress || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return [];
    }
  }

  // Check if user has specific achievement
  static async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      return userAchievements.some(ua => ua.achievementId === achievementId);
    } catch (error) {
      console.error('Error checking if user has achievement:', error);
      return false;
    }
  }

  // Award achievement to user
  static async awardAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const achievement = getAchievementById(achievementId);
      if (!achievement) return false;

      // Check if user already has this achievement
      const userAchievements = await this.getUserAchievements(userId);
      if (userAchievements.some(ua => ua.achievementId === achievementId)) {
        return false; // Already unlocked
      }

      const newAchievement: UserAchievement = {
        achievementId,
        unlockedAt: Date.now(),
        isNew: true
      };

      const docRef = doc(db, this.USER_ACHIEVEMENTS_COLLECTION, userId);
      await updateDoc(docRef, {
        achievements: arrayUnion(newAchievement),
        lastUpdated: serverTimestamp()
      }).catch(async () => {
        // Document doesn't exist, create it
        await setDoc(docRef, {
          achievements: [newAchievement],
          lastUpdated: serverTimestamp()
        });
      });

      // Update user stats
      await this.updateUserAchievementStats(userId);

      // Trigger notification (will be handled by the notification context)
      if (typeof window !== 'undefined') {
        // Dispatch custom event for achievement unlock
        window.dispatchEvent(new CustomEvent('achievementUnlocked', {
          detail: { achievementId }
        }));
      }

      return true;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }
  }

  // Update progress for an achievement
  static async updateProgress(
    userId: string, 
    achievementId: string, 
    currentValue: number
  ): Promise<void> {
    try {
      const docRef = doc(db, this.ACHIEVEMENT_PROGRESS_COLLECTION, userId);
      const achievement = getAchievementById(achievementId);
      
      if (!achievement) return;

      const progressUpdate: AchievementProgress = {
        achievementId,
        currentValue,
        targetValue: achievement.criteria.target,
        lastUpdated: Date.now()
      };

      // Get existing progress
      const docSnap = await getDoc(docRef);
      let existingProgress: AchievementProgress[] = [];
      
      if (docSnap.exists()) {
        existingProgress = docSnap.data().progress || [];
      }

      // Update or add progress
      const existingIndex = existingProgress.findIndex(p => p.achievementId === achievementId);
      if (existingIndex >= 0) {
        existingProgress[existingIndex] = progressUpdate;
      } else {
        existingProgress.push(progressUpdate);
      }

      await setDoc(docRef, {
        progress: existingProgress,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Check if achievement should be awarded
      if (currentValue >= achievement.criteria.target) {
        await this.awardAchievement(userId, achievementId);
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }

  // Track follower achievements
  static async trackFollowerAchievements(userId: string): Promise<string[]> {
    try {
      const followStats = await FollowService.getFollowStats(userId);
      const newlyUnlocked: string[] = [];

      // Check follower count achievements
      const followerAchievements = await this.trackUserAction(userId, 'followers_count', followStats.followersCount);
      newlyUnlocked.push(...followerAchievements);

      // Check following count achievements
      const followingAchievements = await this.trackUserAction(userId, 'following_count', followStats.followingCount);
      newlyUnlocked.push(...followingAchievements);

      return newlyUnlocked;
    } catch (error) {
      console.error('Error tracking follower achievements:', error);
      return [];
    }
  }

  // Track user action and check for achievements
  static async trackUserAction(
    userId: string,
    action: CriteriaType,
    value: number = 1,
    metadata?: Record<string, any>
  ): Promise<string[]> {
    try {
      const newlyUnlocked: string[] = [];

      // Get relevant achievements for this action
      const relevantAchievements = ACHIEVEMENTS.filter(
        achievement => achievement.criteria.type === action
      );

      for (const achievement of relevantAchievements) {
        // Check if user already has this achievement
        const userAchievements = await this.getUserAchievements(userId);
        if (userAchievements.some(ua => ua.achievementId === achievement.id)) {
          continue; // Already unlocked
        }

        // Handle different criteria types
        let shouldAward = false;
        let progressValue = value;

        switch (action) {
          case 'first_meme':
            // Only award if user has ever uploaded AND doesn't already have this achievement
            const hasUploadedEver = await ContentCountService.hasEverUploadedMeme(userId);
            const hasFirstMemeAchievement = await this.hasAchievement(userId, achievement.id);
            shouldAward = hasUploadedEver && !hasFirstMemeAchievement;
            break;

          case 'first_like':
            // Only award if user has ever received like AND doesn't already have this achievement
            const hasReceivedLikeEver = await ContentCountService.hasEverReceivedLike(userId);
            const hasFirstLikeAchievement = await this.hasAchievement(userId, achievement.id);
            shouldAward = hasReceivedLikeEver && !hasFirstLikeAchievement;
            break;

          case 'first_comment':
            // Only award if user has ever commented AND doesn't already have this achievement
            const hasCommentedEver = await ContentCountService.hasEverMadeComment(userId);
            const hasFirstCommentAchievement = await this.hasAchievement(userId, achievement.id);
            shouldAward = hasCommentedEver && !hasFirstCommentAchievement;
            break;

          case 'profile_complete':
            // Only award if user doesn't already have this achievement
            const hasProfileCompleteAchievement = await this.hasAchievement(userId, achievement.id);
            shouldAward = !hasProfileCompleteAchievement;
            break;

          case 'active_memes_uploaded':
            progressValue = await ContentCountService.getActiveMemeCount(userId);
            shouldAward = progressValue >= achievement.criteria.target;
            break;

          case 'total_likes_received':
            progressValue = await ContentCountService.getTotalLikesReceived(userId);
            shouldAward = progressValue >= achievement.criteria.target;
            break;

          case 'total_comments_received':
            progressValue = await ContentCountService.getTotalCommentsReceived(userId);
            shouldAward = progressValue >= achievement.criteria.target;
            break;

          case 'comments_made':
            progressValue = await ContentCountService.getActiveCommentCount(userId);
            shouldAward = progressValue >= achievement.criteria.target;
            break;

          case 'likes_given':
          case 'total_views_received':
            // These remain based on user stats as they're permanent/cumulative
            const userProfile = await UserService.getUserProfile(userId);
            if (userProfile) {
              progressValue = this.getUserStatValue(userProfile, action);
              shouldAward = progressValue >= achievement.criteria.target;
            }
            break;

          case 'viral_meme':
          case 'trending_meme':
          case 'social_butterfly':
          case 'consistency_bonus':
          case 'quality_content':
          case 'community_favorite':
            // These are special achievements that need custom logic
            // For now, we'll handle them separately
            break;
            
          case 'viral_meme':
            // Check if this specific meme reached the target
            shouldAward = value >= achievement.criteria.target;
            break;
            
          case 'night_owl':
          case 'early_bird':
            // Check time-based criteria
            if (metadata?.hour !== undefined) {
              const { startHour, endHour } = achievement.criteria.conditions || {};
              const hour = metadata.hour;
              const isInTimeRange = this.isTimeInRange(hour, startHour, endHour);
              
              if (isInTimeRange) {
                // Update progress for time-based achievements
                const progress = await this.getAchievementProgress(userId);
                const existing = progress.find(p => p.achievementId === achievement.id);
                progressValue = (existing?.currentValue || 0) + 1;
                shouldAward = progressValue >= achievement.criteria.target;
              }
            }
            break;
        }

        // Update progress
        await this.updateProgress(userId, achievement.id, progressValue);

        // Award if criteria met
        if (shouldAward) {
          const awarded = await this.awardAchievement(userId, achievement.id);
          if (awarded) {
            newlyUnlocked.push(achievement.id);
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error tracking user action:', error);
      return [];
    }
  }

  // Helper method to get user stat value
  private static getUserStatValue(userProfile: any, action: CriteriaType): number {
    switch (action) {
      case 'memes_uploaded':
      case 'active_memes_uploaded':
        return userProfile.stats?.memesUploaded || 0;
      case 'total_likes_received':
        return userProfile.stats?.totalLikes || 0;
      case 'total_comments_received':
        return userProfile.stats?.totalComments || 0;
      case 'total_views_received':
        return userProfile.stats?.totalViews || 0;
      case 'likes_given':
        return userProfile.stats?.likesGiven || 0;
      case 'comments_made':
        return userProfile.stats?.commentsMade || 0;
      default:
        return 0;
    }
  }

  // Helper method to check if time is in range
  private static isTimeInRange(hour: number, startHour: number, endHour: number): boolean {
    if (startHour <= endHour) {
      return hour >= startHour && hour <= endHour;
    } else {
      // Crosses midnight (e.g., 22:00 to 02:00)
      return hour >= startHour || hour <= endHour;
    }
  }

  // Update user achievement statistics
  private static async updateUserAchievementStats(userId: string): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const stats: AchievementStats = {
        totalAchievements: ACHIEVEMENTS.length,
        unlockedAchievements: userAchievements.length,
        completionPercentage: Math.round((userAchievements.length / ACHIEVEMENTS.length) * 100),
        latestAchievement: userAchievements[userAchievements.length - 1],
        rareAchievements: userAchievements.filter(ua => {
          const achievement = getAchievementById(ua.achievementId);
          return achievement && ['platinum', 'diamond'].includes(achievement.tier);
        }).length
      };

      // Update user profile with achievement stats
      await UserService.updateUserProfile(userId, {
        achievementStats: stats
      } as any);
    } catch (error) {
      console.error('Error updating user achievement stats:', error);
    }
  }

  // Mark achievement as seen (remove "NEW" badge)
  static async markAchievementAsSeen(userId: string, achievementId: string): Promise<void> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const updatedAchievements = userAchievements.map(ua => 
        ua.achievementId === achievementId 
          ? { ...ua, isNew: false }
          : ua
      );

      const docRef = doc(db, this.USER_ACHIEVEMENTS_COLLECTION, userId);
      await updateDoc(docRef, {
        achievements: updatedAchievements,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking achievement as seen:', error);
    }
  }

  // Recalculate achievements after content deletion
  static async recalculateAchievements(userId: string): Promise<string[]> {
    try {
      const revokedAchievements: string[] = [];
      const userAchievements = await this.getUserAchievements(userId);

      // Get current active stats
      const activeStats = await ContentCountService.getUserActiveStats(userId);

      // Check each unlocked achievement to see if it should be revoked
      for (const userAchievement of userAchievements) {
        const achievement = getAchievementById(userAchievement.achievementId);
        if (!achievement) continue;

        // Skip permanent achievements
        if (['first_meme', 'first_like', 'first_comment', 'profile_complete'].includes(achievement.criteria.type)) {
          continue;
        }

        let shouldRevoke = false;

        switch (achievement.criteria.type) {
          case 'active_memes_uploaded':
            shouldRevoke = activeStats.activeMemes < achievement.criteria.target;
            break;
          case 'total_likes_received':
            shouldRevoke = activeStats.totalLikes < achievement.criteria.target;
            break;
          case 'total_comments_received':
            shouldRevoke = activeStats.totalComments < achievement.criteria.target;
            break;
          case 'comments_made':
            shouldRevoke = activeStats.activeComments < achievement.criteria.target;
            break;
          case 'followers_count':
            const followStats = await FollowService.getFollowStats(userId);
            shouldRevoke = followStats.followersCount < achievement.criteria.target;
            break;
          case 'following_count':
            const followingStats = await FollowService.getFollowStats(userId);
            shouldRevoke = followingStats.followingCount < achievement.criteria.target;
            break;
        }

        if (shouldRevoke) {
          await this.revokeAchievement(userId, achievement.id);
          revokedAchievements.push(achievement.id);
        }
      }

      return revokedAchievements;
    } catch (error) {
      console.error('Error recalculating achievements:', error);
      return [];
    }
  }

  // Revoke an achievement
  static async revokeAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const updatedAchievements = userAchievements.filter(ua => ua.achievementId !== achievementId);

      const docRef = doc(db, this.USER_ACHIEVEMENTS_COLLECTION, userId);
      await updateDoc(docRef, {
        achievements: updatedAchievements,
        lastUpdated: serverTimestamp()
      }).catch(async () => {
        // Document doesn't exist, create it
        await setDoc(docRef, {
          achievements: updatedAchievements,
          lastUpdated: serverTimestamp()
        });
      });

      return true;
    } catch (error) {
      console.error('Error revoking achievement:', error);
      return false;
    }
  }

  // Get achievement statistics
  static async getAchievementStats(userId: string): Promise<AchievementStats> {
    try {
      const userAchievements = await this.getUserAchievements(userId);

      return {
        totalAchievements: ACHIEVEMENTS.length,
        unlockedAchievements: userAchievements.length,
        completionPercentage: Math.round((userAchievements.length / ACHIEVEMENTS.length) * 100),
        latestAchievement: userAchievements[userAchievements.length - 1],
        rareAchievements: userAchievements.filter(ua => {
          const achievement = getAchievementById(ua.achievementId);
          return achievement && ['platinum', 'diamond'].includes(achievement.tier);
        }).length
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      return {
        totalAchievements: ACHIEVEMENTS.length,
        unlockedAchievements: 0,
        completionPercentage: 0,
        rareAchievements: 0
      };
    }
  }
}
