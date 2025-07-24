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
  writeBatch,
  runTransaction,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Follow, FollowStats } from '../types/follow';

export class FollowService {
  private static readonly FOLLOWS_COLLECTION = 'follows';
  private static readonly FOLLOW_STATS_COLLECTION = 'followStats';

  // Optimized follow user with transaction and increment
  static async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    try {
      const followId = `${followerId}_${followingId}`;
      
      // Use transaction for atomic operations
      await runTransaction(db, async (transaction) => {
        const followRef = doc(db, this.FOLLOWS_COLLECTION, followId);
        const followerStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followerId);
        const followingStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followingId);

        // PHASE 1: ALL READS FIRST (required by Firestore transactions)
        const existingFollow = await transaction.get(followRef);
        const followerStatsDoc = await transaction.get(followerStatsRef);
        const followingStatsDoc = await transaction.get(followingStatsRef);

        // Check if already following
        if (existingFollow.exists()) {
          throw new Error('Already following this user');
        }

        // Process read data
        const followerStats = followerStatsDoc.exists() 
          ? followerStatsDoc.data() as FollowStats
          : { followersCount: 0, followingCount: 0 };
        
        const followingStats = followingStatsDoc.exists()
          ? followingStatsDoc.data() as FollowStats
          : { followersCount: 0, followingCount: 0 };

        // PHASE 2: ALL WRITES AFTER READS
        // Create follow relationship
        const followDoc: Follow = {
          id: followId,
          followerId,
          followingId,
          createdAt: Date.now()
        };
        transaction.set(followRef, followDoc);

        // Update stats using increment for better performance
        transaction.set(followerStatsRef, {
          followersCount: followerStats.followersCount,
          followingCount: followerStats.followingCount + 1
        });

        transaction.set(followingStatsRef, {
          followersCount: followingStats.followersCount + 1,
          followingCount: followingStats.followingCount
        });
      });

      // Clear caches for affected users
      this.clearUserCaches(followerId, followingId);

      // Run non-critical operations asynchronously (don't wait for them)
      this.handleFollowSideEffects(followerId, followingId);

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  // Optimized unfollow user with transaction
  static async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followId = `${followerId}_${followingId}`;
      
      // Use transaction for atomic operations
      await runTransaction(db, async (transaction) => {
        const followRef = doc(db, this.FOLLOWS_COLLECTION, followId);
        const followerStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followerId);
        const followingStatsRef = doc(db, this.FOLLOW_STATS_COLLECTION, followingId);

        // PHASE 1: ALL READS FIRST (required by Firestore transactions)
        const existingFollow = await transaction.get(followRef);
        const followerStatsDoc = await transaction.get(followerStatsRef);
        const followingStatsDoc = await transaction.get(followingStatsRef);

        // Check if currently following
        if (!existingFollow.exists()) {
          throw new Error('Not currently following this user');
        }

        // Process read data
        const followerStats = followerStatsDoc.exists() 
          ? followerStatsDoc.data() as FollowStats
          : { followersCount: 0, followingCount: 0 };
        
        const followingStats = followingStatsDoc.exists()
          ? followingStatsDoc.data() as FollowStats
          : { followersCount: 0, followingCount: 0 };

        // PHASE 2: ALL WRITES AFTER READS
        // Delete follow relationship
        transaction.delete(followRef);

        // Update stats
        transaction.set(followerStatsRef, {
          followersCount: followerStats.followersCount,
          followingCount: Math.max(0, followerStats.followingCount - 1)
        });

        transaction.set(followingStatsRef, {
          followersCount: Math.max(0, followingStats.followersCount - 1),
          followingCount: followingStats.followingCount
        });
      });

      // Clear caches for affected users
      this.clearUserCaches(followerId, followingId);

      // Run non-critical operations asynchronously
      this.handleUnfollowSideEffects(followerId, followingId);

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Handle follow side effects asynchronously (non-blocking)
  private static async handleFollowSideEffects(followerId: string, followingId: string) {
    try {
      // Run notification and achievement tracking in parallel
      await Promise.allSettled([
        this.createFollowNotification(followerId, followingId),
        this.trackFollowAchievements(followerId, followingId)
      ]);
    } catch (error) {
      console.error('Error in follow side effects:', error);
      // Don't throw - these are non-critical operations
    }
  }

  // Handle unfollow side effects asynchronously (non-blocking)
  private static async handleUnfollowSideEffects(followerId: string, followingId: string) {
    try {
      // Only track achievements for unfollow (no notification needed)
      await this.trackUnfollowAchievements(followerId, followingId);
    } catch (error) {
      console.error('Error in unfollow side effects:', error);
      // Don't throw - these are non-critical operations
    }
  }

  // Optimized notification creation
  private static async createFollowNotification(followerId: string, followingId: string) {
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
  }

  // Optimized achievement tracking for follow
  private static async trackFollowAchievements(followerId: string, followingId: string) {
    try {
      const { AchievementService } = await import('./achievementService');
      // Run achievement tracking in parallel instead of sequential
      await Promise.allSettled([
        AchievementService.trackFollowerAchievements(followingId),
        AchievementService.trackFollowerAchievements(followerId)
      ]);
    } catch (error) {
      console.error('Error tracking follow achievements:', error);
    }
  }

  // Optimized achievement tracking for unfollow
  private static async trackUnfollowAchievements(followerId: string, followingId: string) {
    try {
      const { AchievementService } = await import('./achievementService');
      // Run achievement tracking in parallel
      await Promise.allSettled([
        AchievementService.trackFollowerAchievements(followingId),
        AchievementService.trackFollowerAchievements(followerId)
      ]);
    } catch (error) {
      console.error('Error tracking unfollow achievements:', error);
    }
  }

  // Cache for follow status and stats (short-term caching)
  private static followStatusCache = new Map<string, { status: boolean; timestamp: number }>();
  private static followStatsCache = new Map<string, { stats: FollowStats; timestamp: number }>();
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  // Optimized check if user is following another user with caching
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const cacheKey = `${followerId}_${followingId}`;
    const cached = this.followStatusCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.status;
    }

    try {
      const followId = `${followerId}_${followingId}`;
      const followDoc = await getDoc(doc(db, this.FOLLOWS_COLLECTION, followId));
      const isFollowing = followDoc.exists();
      
      // Cache the result
      this.followStatusCache.set(cacheKey, { 
        status: isFollowing, 
        timestamp: Date.now() 
      });
      
      return isFollowing;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Optimized get follow stats with caching
  static async getFollowStats(userId: string): Promise<FollowStats> {
    const cached = this.followStatsCache.get(userId);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.stats;
    }

    try {
      const statsDoc = await getDoc(doc(db, this.FOLLOW_STATS_COLLECTION, userId));
      const stats = statsDoc.exists() 
        ? statsDoc.data() as FollowStats
        : { followersCount: 0, followingCount: 0 };
      
      // Cache the result
      this.followStatsCache.set(userId, { 
        stats, 
        timestamp: Date.now() 
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return { followersCount: 0, followingCount: 0 };
    }
  }

  // Clear cache for specific users (call this after follow/unfollow operations)
  private static clearUserCaches(followerId: string, followingId: string) {
    // Clear follow status cache
    this.followStatusCache.delete(`${followerId}_${followingId}`);
    
    // Clear stats cache for both users
    this.followStatsCache.delete(followerId);
    this.followStatsCache.delete(followingId);
  }

  // Optimized batch check for multiple follow statuses
  static async batchCheckFollowing(
    followerId: string, 
    targetUserIds: string[]
  ): Promise<Record<string, boolean>> {
    try {
      const results: Record<string, boolean> = {};
      const uncachedIds: string[] = [];
      
      // Check cache first
      for (const targetId of targetUserIds) {
        const cacheKey = `${followerId}_${targetId}`;
        const cached = this.followStatusCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          results[targetId] = cached.status;
        } else {
          uncachedIds.push(targetId);
        }
      }
      
      // Batch fetch uncached statuses
      if (uncachedIds.length > 0) {
        const followIds = uncachedIds.map(id => `${followerId}_${id}`);
        const batch = await Promise.all(
          followIds.map(id => getDoc(doc(db, this.FOLLOWS_COLLECTION, id)))
        );
        
        batch.forEach((doc, index) => {
          const targetId = uncachedIds[index];
          const isFollowing = doc.exists();
          results[targetId] = isFollowing;
          
          // Cache the result
          this.followStatusCache.set(`${followerId}_${targetId}`, {
            status: isFollowing,
            timestamp: Date.now()
          });
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error batch checking follow status:', error);
      return {};
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
        collection(db, this.FOLLOWS_COLLECTION),
        where('followerId', '==', userId)
      );
      const followingSnapshot = await getDocs(followingQuery);

      // Delete all follows where user is being followed
      const followersQuery = query(
        collection(db, this.FOLLOWS_COLLECTION),
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
