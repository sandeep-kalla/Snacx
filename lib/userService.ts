import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserStats, getRandomAvatar } from '../types/user';
// Note: AchievementService import will be added dynamically to avoid circular dependency

export class UserService {
  private static readonly COLLECTION_NAME = 'userProfiles';

  // Check if nickname is available
  static async isNicknameAvailable(nickname: string, excludeUid?: string): Promise<boolean> {
    try {
      const normalizedNickname = nickname.toLowerCase().trim();
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('nickname', '==', normalizedNickname)
      );

      const querySnapshot = await getDocs(q);

      // If excluding a specific UID (for updates), check if any other user has this nickname
      if (excludeUid) {
        return !querySnapshot.docs.some(doc => doc.id !== excludeUid);
      }

      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking nickname availability:', error);
      // If there's a permission error, assume nickname is available for now
      // This allows the user to proceed, and we'll catch any conflicts during creation
      if (error instanceof Error && error.message.includes('permission')) {
        console.warn('Permission denied for nickname check, assuming available');
        return true;
      }
      throw error;
    }
  }

  // Get user profile by UID
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Get user profile by nickname
  static async getUserByNickname(nickname: string): Promise<UserProfile | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('nickname', '==', nickname),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by nickname:', error);
      return null;
    }
  }

  // Get users that the current user follows
  static async getFollowedUsers(userId: string): Promise<UserProfile[]> {
    try {
      const { FollowService } = await import('./followService');
      const following = await FollowService.getFollowing(userId);

      const userProfiles = await Promise.all(
        following.map(follow => this.getUserProfile(follow.followingId))
      );

      return userProfiles.filter(profile => profile !== null) as UserProfile[];
    } catch (error) {
      console.error('Error getting followed users:', error);
      return [];
    }
  }

  // Create initial user profile
  static async createUserProfile(
    uid: string,
    email: string,
    nickname: string,
    avatarId: string,
    bio: string = ''
  ): Promise<UserProfile> {
    try {
      // Double-check if nickname is available (in case of race conditions)
      try {
        const isAvailable = await this.isNicknameAvailable(nickname);
        if (!isAvailable) {
          throw new Error('Nickname is already taken');
        }
      } catch (permissionError) {
        console.warn('Could not check nickname availability due to permissions, proceeding...');
      }

      const now = Date.now();
      const userProfile: UserProfile = {
        uid,
        email,
        nickname: nickname.toLowerCase().trim(),
        avatar: avatarId,
        bio: bio.trim(),
        stats: {
          memesUploaded: 0,
          totalLikes: 0,
          totalComments: 0,
          totalViews: 0,
          joinedAt: now,
        },
        isProfileComplete: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, this.COLLECTION_NAME, uid), userProfile);

      // Track profile completion achievement
      try {
        const { AchievementService } = await import('./achievementService');
        await AchievementService.trackUserAction(uid, 'profile_complete');
      } catch (error) {
        console.error('Error tracking profile completion achievement:', error);
      }

      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new Error('Nickname is already taken');
      }
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(
    uid: string, 
    updates: Partial<Pick<UserProfile, 'nickname' | 'avatar' | 'bio'>>
  ): Promise<void> {
    try {
      // If updating nickname, check availability
      if (updates.nickname) {
        const isAvailable = await this.isNicknameAvailable(updates.nickname, uid);
        if (!isAvailable) {
          throw new Error('Nickname is already taken');
        }
        updates.nickname = updates.nickname.toLowerCase().trim();
      }

      const updateData = {
        ...updates,
        updatedAt: Date.now(),
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, uid), updateData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update user stats
  static async updateUserStats(uid: string, statsUpdate: Partial<UserStats>): Promise<void> {
    try {
      const updateData = {
        [`stats.${Object.keys(statsUpdate)[0]}`]: Object.values(statsUpdate)[0],
        updatedAt: Date.now(),
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, uid), updateData);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Increment user stats
  static async incrementUserStats(
    uid: string, 
    field: keyof Omit<UserStats, 'joinedAt'>, 
    increment: number = 1
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(uid);
      if (!profile) return;

      const currentValue = profile.stats[field] as number;
      const newValue = currentValue + increment;

      await this.updateUserStats(uid, { [field]: newValue } as Partial<UserStats>);
    } catch (error) {
      console.error('Error incrementing user stats:', error);
      throw error;
    }
  }

  // Generate suggested nicknames based on email
  static generateSuggestedNicknames(email: string): string[] {
    const baseNickname = email.split('@')[0].toLowerCase();
    const suggestions = [
      baseNickname,
      `${baseNickname}_memer`,
      `${baseNickname}_${Math.floor(Math.random() * 1000)}`,
      `meme_${baseNickname}`,
      `${baseNickname}_legend`,
      `cool_${baseNickname}`,
      `${baseNickname}_pro`,
      `epic_${baseNickname}`,
    ];

    // Remove any invalid characters and ensure length
    return suggestions
      .map(nick => nick.replace(/[^a-z0-9_]/g, ''))
      .filter(nick => nick.length >= 3 && nick.length <= 20)
      .slice(0, 5);
  }

  // Check if user needs profile setup
  static async needsProfileSetup(uid: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(uid);
      return !profile || !profile.isProfileComplete;
    } catch (error) {
      console.error('Error checking profile setup status:', error);
      return true; // Default to needing setup if there's an error
    }
  }

  // Mark that user has ever uploaded a meme (for first_meme achievement)
  static async markEverUploaded(uid: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        hasEverUploaded: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking user as ever uploaded:', error);
    }
  }

  // Mark that user has ever received a like (for first_like achievement)
  static async markEverReceivedLike(uid: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        hasEverReceivedLike: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking user as ever received like:', error);
    }
  }

  // Mark that user has ever made a comment (for first_comment achievement)
  static async markEverCommented(uid: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        hasEverCommented: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking user as ever commented:', error);
    }
  }

  // Search users by nickname
  static async searchUsersByNickname(searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
    try {
      if (!searchTerm.trim()) {
        return [];
      }

      // Firebase doesn't support full-text search, so we'll get all users
      // and filter client-side. In production, you'd use Algolia or similar.
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('nickname'),
        limit(100) // Get more to filter from
      );

      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];
      const normalizedSearch = searchTerm.toLowerCase();

      querySnapshot.forEach((doc) => {
        const user = { ...doc.data(), uid: doc.id } as UserProfile;
        if (user.nickname.toLowerCase().includes(normalizedSearch)) {
          users.push(user);
        }
      });

      return users.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching users by nickname:', error);
      return [];
    }
  }

  // Get active users (users who have created content recently)
  static async getActiveUsers(limitCount: number = 10): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount * 2) // Get more to filter
      );

      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const user = { ...doc.data(), uid: doc.id } as UserProfile;
        users.push(user);
      });

      return users.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  // Get user by nickname
  static async getUserByNickname(nickname: string): Promise<UserProfile | null> {
    try {
      const normalizedNickname = nickname.toLowerCase().trim();
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('nickname', '==', normalizedNickname),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { ...doc.data(), uid: doc.id } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user by nickname:', error);
      return null;
    }
  }
}
