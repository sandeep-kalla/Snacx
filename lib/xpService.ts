import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  UserXP, 
  XPTransaction, 
  XPAction, 
  XP_VALUES, 
  getLevelByXP, 
  calculateXPToNextLevel,
  calculateLevelProgress 
} from '../types/userLevel';

export class XPService {
  private static readonly USER_XP_COLLECTION = 'userXP';
  private static readonly XP_TRANSACTIONS_COLLECTION = 'xpTransactions';

  // Get user's XP data
  static async getUserXP(userId: string): Promise<UserXP | null> {
    try {
      const docRef = doc(db, this.USER_XP_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId,
          totalXP: data.totalXP || 0,
          currentLevel: data.currentLevel || 1,
          xpToNextLevel: data.xpToNextLevel || 0,
          lastUpdated: data.lastUpdated || Date.now(),
          xpHistory: data.xpHistory || []
        };
      }
      
      // Create initial XP record
      const initialXP: UserXP = {
        userId,
        totalXP: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        lastUpdated: Date.now(),
        xpHistory: []
      };
      
      await setDoc(docRef, initialXP);
      return initialXP;
    } catch (error) {
      console.error('Error getting user XP:', error);
      return null;
    }
  }

  // Award XP to user
  static async awardXP(
    userId: string, 
    action: XPAction, 
    customAmount?: number,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<{ newLevel: boolean; levelUp: boolean; newXP: number; newLevel: number } | null> {
    try {
      const userXP = await this.getUserXP(userId);
      if (!userXP) return null;

      const xpAmount = customAmount || XP_VALUES[action] || 0;
      const oldLevel = getLevelByXP(userXP.totalXP || 0);
      const newTotalXP = (userXP.totalXP || 0) + xpAmount;
      const newLevel = getLevelByXP(newTotalXP);
      const levelUp = newLevel.level > oldLevel.level;

      // Create XP transaction with validation
      const transaction: XPTransaction = {
        id: `${userId}_${Date.now()}`,
        action,
        amount: xpAmount,
        timestamp: Date.now(),
        description: description || this.getActionDescription(action) || 'XP earned',
        ...(metadata && { metadata })
      };

      // Update user XP with validation
      const xpToNextLevel = calculateXPToNextLevel(newTotalXP);
      const updatedXP: UserXP = {
        ...userXP,
        totalXP: newTotalXP,
        currentLevel: newLevel?.level || 1,
        xpToNextLevel: xpToNextLevel >= 0 ? xpToNextLevel : 0,
        lastUpdated: Date.now(),
        xpHistory: [...(userXP.xpHistory || []).slice(-49), transaction] // Keep last 50 transactions
      };

      // Filter out undefined values before updating
      const cleanedXP = Object.fromEntries(
        Object.entries(updatedXP).filter(([_, value]) => value !== undefined)
      );

      const docRef = doc(db, this.USER_XP_COLLECTION, userId);
      await updateDoc(docRef, cleanedXP);

      // Log transaction separately for analytics
      await this.logXPTransaction(transaction);

      return {
        newLevel: levelUp,
        levelUp,
        newXP: newTotalXP,
        newLevel: newLevel.level
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return null;
    }
  }

  // Log XP transaction
  private static async logXPTransaction(transaction: XPTransaction): Promise<void> {
    try {
      const docRef = doc(db, this.XP_TRANSACTIONS_COLLECTION, transaction.id);
      await setDoc(docRef, transaction);
    } catch (error) {
      console.error('Error logging XP transaction:', error);
    }
  }

  // Get action description
  private static getActionDescription(action: XPAction): string {
    const descriptions: Record<XPAction, string> = {
      meme_upload: 'Uploaded a meme',
      meme_like_received: 'Received a like on your meme',
      meme_like_given: 'Liked someone\'s meme',
      comment_made: 'Made a comment',
      comment_received: 'Received a comment on your meme',
      achievement_unlocked: 'Unlocked an achievement',
      daily_login: 'Daily login bonus',
      profile_complete: 'Completed your profile',
      viral_meme: 'Your meme went viral!',
      trending_meme: 'Your meme is trending!',
      social_butterfly: 'Social butterfly bonus',
      consistency_bonus: 'Consistency bonus',
      quality_content: 'Quality content bonus',
      community_favorite: 'Community favorite bonus'
    };
    
    return descriptions[action] || 'XP earned';
  }

  // Get XP leaderboard
  static async getXPLeaderboard(limitCount: number = 50): Promise<UserXP[]> {
    try {
      const q = query(
        collection(db, this.USER_XP_COLLECTION),
        orderBy('totalXP', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard: UserXP[] = [];
      
      querySnapshot.forEach((doc) => {
        leaderboard.push(doc.data() as UserXP);
      });
      
      return leaderboard;
    } catch (error) {
      console.error('Error getting XP leaderboard:', error);
      return [];
    }
  }

  // Get user's rank
  static async getUserRank(userId: string): Promise<number> {
    try {
      const userXP = await this.getUserXP(userId);
      if (!userXP) return 0;

      const q = query(
        collection(db, this.USER_XP_COLLECTION),
        orderBy('totalXP', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      let rank = 1;
      
      for (const doc of querySnapshot.docs) {
        if (doc.id === userId) {
          return rank;
        }
        rank++;
      }
      
      return rank;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  }

  // Calculate XP for achievement unlock
  static calculateAchievementXP(achievementTier: string): number {
    const tierMultipliers = {
      bronze: 1,
      silver: 1.5,
      gold: 2,
      platinum: 3,
      diamond: 5,
      special: 2.5
    };
    
    const baseXP = XP_VALUES.achievement_unlocked;
    const multiplier = tierMultipliers[achievementTier as keyof typeof tierMultipliers] || 1;
    
    return Math.floor(baseXP * multiplier);
  }

  // Award daily login bonus
  static async awardDailyLoginBonus(userId: string): Promise<boolean> {
    try {
      const userXP = await this.getUserXP(userId);
      if (!userXP) return false;

      const today = new Date().toDateString();
      const lastLogin = new Date(userXP.lastUpdated).toDateString();
      
      if (today !== lastLogin) {
        await this.awardXP(userId, 'daily_login', undefined, 'Daily login bonus');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error awarding daily login bonus:', error);
      return false;
    }
  }

  // Get recent XP transactions
  static async getRecentTransactions(userId: string, limitCount: number = 10): Promise<XPTransaction[]> {
    try {
      const userXP = await this.getUserXP(userId);
      if (!userXP) return [];

      return userXP.xpHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }
}
