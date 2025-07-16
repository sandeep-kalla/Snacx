import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Follow, FollowStats } from '../types/follow';
import { UserService } from './userService';
import { NotificationService } from './notificationService';
import { AchievementService } from './achievementService';

export class FollowService {
  private static readonly FOLLOWS_COLLECTION = 'follows';
  private static readonly FOLLOW_STATS_COLLECTION = 'followStats';

  // Follow a user
  static async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    try {
      const followId = `${followerId}_${followingId}`;
      const followDoc: Follow = {
        id: followId,
        followerId,
        followingId,
        createdAt: Date.now()
      };

      const batch = writeBatch(db);

      // Create follow relationship
      batch.set(doc(db, this.FOLLOWS_COLLECTION, followId), followDoc);

      // Update follower's following count
      const followerStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followerId);
      const followerStats = await this.getFollowStats(followerId);
      batch.set(followerStatsRef, {
        followersCount: followerStats.followersCount,
        followingCount: followerStats.followingCount + 1
      });

      // Update following user's followers count
      const followingStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followingId);
      const followingStats = await this.getFollowStats(followingId);
      batch.set(followingStatsRef, {
        followersCount: followingStats.followersCount + 1,
        followingCount: followingStats.followingCount
      });

      await batch.commit();

      // Create notification for the followed user
      try {
        const { NotificationService } = await import('./notificationService');
        await NotificationService.createNotification({
          userId: followingId,
          fromUserId: followerId,
          type: 'follow',
          message: 'started following you',
          read: false,
          createdAt: Date.now()
        });
      } catch (error) {
        console.error('Error creating follow notification:', error);
      }

      // Track achievements for both users
      try {
        // Track follower achievements for the followed user
        await AchievementService.trackFollowerAchievements(followingId);

        // Track following achievements for the follower
        await AchievementService.trackFollowerAchievements(followerId);
      } catch (error) {
        console.error('Error tracking follower achievements:', error);
      }

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  // Unfollow a user
  static async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followId = `${followerId}_${followingId}`;
      
      const batch = writeBatch(db);

      // Delete follow relationship
      batch.delete(doc(db, this.FOLLOWS_COLLECTION, followId));

      // Update follower's following count
      const followerStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followerId);
      const followerStats = await this.getFollowStats(followerId);
      batch.set(followerStatsRef, {
        followersCount: followerStats.followersCount,
        followingCount: Math.max(0, followerStats.followingCount - 1)
      });

      // Update following user's followers count
      const followingStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followingId);
      const followingStats = await this.getFollowStats(followingId);
      batch.set(followingStatsRef, {
        followersCount: Math.max(0, followingStats.followersCount - 1),
        followingCount: followingStats.followingCount
      });

      await batch.commit();

      // Track achievements for both users after unfollow
      try {
        // Track follower achievements for the unfollowed user
        await AchievementService.trackFollowerAchievements(followingId);

        // Track following achievements for the unfollower
        await AchievementService.trackFollowerAchievements(followerId);
      } catch (error) {
        console.error('Error tracking follower achievements after unfollow:', error);
      }

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Check if user is following another user
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followId = `${followerId}_${followingId}`;
      const followDoc = await getDoc(doc(db, this.FOLLOWS_COLLECTION, followId));
      return followDoc.exists();
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Get follow stats for a user
  static async getFollowStats(userId: string): Promise<FollowStats> {
    try {
      const statsDoc = await getDoc(doc(db, this.FOLLOW_STATS_COLLECTION, userId));
      if (statsDoc.exists()) {
        return statsDoc.data() as FollowStats;
      }
      return { followersCount: 0, followingCount: 0 };
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return { followersCount: 0, followingCount: 0 };
    }
  }

  // Get followers list
  static async getFollowers(userId: string, limitCount: number = 50): Promise<Follow[]> {
    try {
      const q = query(
        collection(db, this.FOLLOWS_COLLECTION),
        where('followingId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Follow);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  // Get following list
  static async getFollowing(userId: string, limitCount: number = 50): Promise<Follow[]> {
    try {
      const q = query(
        collection(db, this.FOLLOWS_COLLECTION),
        where('followerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Follow);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  // Get mutual followers (users who follow both users)
  static async getMutualFollowers(userId1: string, userId2: string): Promise<string[]> {
    try {
      const [followers1, followers2] = await Promise.all([
        this.getFollowers(userId1),
        this.getFollowers(userId2)
      ]);

      const followers1Ids = new Set(followers1.map(f => f.followerId));
      const mutualFollowers = followers2
        .filter(f => followers1Ids.has(f.followerId))
        .map(f => f.followerId);

      return mutualFollowers;
    } catch (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }
  }

  // Get suggested users to follow (users with most followers that current user doesn't follow)
  static async getSuggestedUsers(userId: string, limitCount: number = 10): Promise<string[]> {
    try {
      // Get users current user is already following
      const following = await this.getFollowing(userId);
      const followingIds = new Set(following.map(f => f.followingId));
      followingIds.add(userId); // Don't suggest self

      // Get all follow stats and sort by followers count
      const statsQuery = query(collection(db, this.FOLLOW_STATS_COLLECTION));
      const statsSnapshot = await getDocs(statsQuery);
      
      const suggestions = statsSnapshot.docs
        .filter(doc => !followingIds.has(doc.id))
        .map(doc => ({
          userId: doc.id,
          stats: doc.data() as FollowStats
        }))
        .sort((a, b) => b.stats.followersCount - a.stats.followersCount)
        .slice(0, limitCount)
        .map(item => item.userId);

      return suggestions;
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  }

  // Delete all follows for a user (for account deletion)
  static async deleteAllUserFollows(userId: string): Promise<void> {
    try {
      // Delete all follows where user is the follower
      const followingQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('followerId', '==', userId)
      );
      const followingSnapshot = await getDocs(followingQuery);

      // Delete all follows where user is being followed
      const followersQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('followingId', '==', userId)
      );
      const followersSnapshot = await getDocs(followersQuery);

      // Delete all documents
      const deletePromises = [
        ...followingSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...followersSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ];

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting user follows:', error);
      throw error;
    }
  }
}
