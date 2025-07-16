import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { MonthlyTopPerformer, TopPerformersData } from '../types/follow';
import { UserService } from './userService';
import { ContentCountService } from './contentCountService';

export class MonthlyLeaderboardService {
  private static readonly TOP_PERFORMERS_COLLECTION = 'monthlyTopPerformers';

  // Generate monthly top performers (run this on the 1st of each month)
  static async generateMonthlyTopPerformers(year: number, month: number): Promise<TopPerformersData> {
    try {
      // Get all users with their stats
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const userPerformances: Array<{
        userId: string;
        nickname: string;
        avatar: string;
        score: number;
      }> = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        try {
          // Get user's active stats for scoring
          const activeStats = await ContentCountService.getUserActiveStats(userId);
          
          // Calculate performance score
          // Formula: (likes * 2) + (comments * 1.5) + (active_memes * 3) + (views * 0.1)
          const score = Math.round(
            (activeStats.totalLikes * 2) + 
            (activeStats.totalComments * 1.5) + 
            (activeStats.activeMemes * 3) + 
            (activeStats.totalViews * 0.1)
          );

          if (score > 0) { // Only include users with some activity
            userPerformances.push({
              userId,
              nickname: userData.nickname || userData.displayName || 'Anonymous',
              avatar: userData.avatar || 'cat',
              score
            });
          }
        } catch (error) {
          console.error(`Error calculating score for user ${userId}:`, error);
        }
      }

      // Sort by score and get top 3
      userPerformances.sort((a, b) => b.score - a.score);
      const top3 = userPerformances.slice(0, 3);

      // Create top performers data
      const topPerformers: MonthlyTopPerformer[] = top3.map((performer, index) => ({
        userId: performer.userId,
        nickname: performer.nickname,
        avatar: performer.avatar,
        score: performer.score,
        rank: index + 1,
        month,
        year
      }));

      const topPerformersData: TopPerformersData = {
        month,
        year,
        performers: topPerformers,
        generatedAt: Date.now()
      };

      // Save to Firestore
      const docId = `${year}-${month.toString().padStart(2, '0')}`;
      await setDoc(doc(db, this.TOP_PERFORMERS_COLLECTION, docId), topPerformersData);

      return topPerformersData;
    } catch (error) {
      console.error('Error generating monthly top performers:', error);
      throw error;
    }
  }

  // Get top performers for a specific month
  static async getMonthlyTopPerformers(year: number, month: number): Promise<TopPerformersData | null> {
    try {
      const docId = `${year}-${month.toString().padStart(2, '0')}`;
      const docRef = doc(db, this.TOP_PERFORMERS_COLLECTION, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as TopPerformersData;
      }
      return null;
    } catch (error) {
      console.error('Error getting monthly top performers:', error);
      return null;
    }
  }

  // Get the most recent top performers
  static async getLatestTopPerformers(): Promise<TopPerformersData | null> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Try current month first
      let topPerformers = await this.getMonthlyTopPerformers(currentYear, currentMonth);
      
      if (!topPerformers) {
        // Try previous month
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        topPerformers = await this.getMonthlyTopPerformers(prevYear, prevMonth);
      }

      return topPerformers;
    } catch (error) {
      console.error('Error getting latest top performers:', error);
      return null;
    }
  }

  // Check if we should show the banner (1st and 2nd of each month)
  static shouldShowBanner(): boolean {
    const now = new Date();
    const dayOfMonth = now.getDate();
    return dayOfMonth === 1 || dayOfMonth === 2;
  }

  // Get previous month's top performers (for showing on 1st and 2nd)
  static async getPreviousMonthTopPerformers(): Promise<TopPerformersData | null> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      return await this.getMonthlyTopPerformers(prevYear, prevMonth);
    } catch (error) {
      console.error('Error getting previous month top performers:', error);
      return null;
    }
  }

  // Auto-generate current month's leaderboard if it doesn't exist
  static async ensureCurrentMonthLeaderboard(): Promise<TopPerformersData | null> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Check if current month's leaderboard exists
      let topPerformers = await this.getMonthlyTopPerformers(currentYear, currentMonth);
      
      if (!topPerformers) {
        // Generate it
        topPerformers = await this.generateMonthlyTopPerformers(currentYear, currentMonth);
      }

      return topPerformers;
    } catch (error) {
      console.error('Error ensuring current month leaderboard:', error);
      return null;
    }
  }

  // Get all historical top performers
  static async getAllHistoricalTopPerformers(): Promise<TopPerformersData[]> {
    try {
      const q = query(
        collection(db, this.TOP_PERFORMERS_COLLECTION),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as TopPerformersData);
    } catch (error) {
      console.error('Error getting historical top performers:', error);
      return [];
    }
  }

  // Get user's best monthly performance
  static async getUserBestMonthlyPerformance(userId: string): Promise<MonthlyTopPerformer | null> {
    try {
      const allPerformers = await this.getAllHistoricalTopPerformers();
      let bestPerformance: MonthlyTopPerformer | null = null;

      for (const monthData of allPerformers) {
        const userPerformance = monthData.performers.find(p => p.userId === userId);
        if (userPerformance) {
          if (!bestPerformance || userPerformance.rank < bestPerformance.rank || 
              (userPerformance.rank === bestPerformance.rank && userPerformance.score > bestPerformance.score)) {
            bestPerformance = userPerformance;
          }
        }
      }

      return bestPerformance;
    } catch (error) {
      console.error('Error getting user best monthly performance:', error);
      return null;
    }
  }

  // Get monthly performance history for a user
  static async getUserMonthlyHistory(userId: string): Promise<MonthlyTopPerformer[]> {
    try {
      const allPerformers = await this.getAllHistoricalTopPerformers();
      const userHistory: MonthlyTopPerformer[] = [];

      for (const monthData of allPerformers) {
        const userPerformance = monthData.performers.find(p => p.userId === userId);
        if (userPerformance) {
          userHistory.push(userPerformance);
        }
      }

      return userHistory.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    } catch (error) {
      console.error('Error getting user monthly history:', error);
      return [];
    }
  }

  // Clean up old leaderboards (keep only last 12 months)
  static async cleanupOldLeaderboards(): Promise<void> {
    try {
      const now = new Date();
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      
      const allPerformers = await this.getAllHistoricalTopPerformers();
      
      for (const monthData of allPerformers) {
        const monthDate = new Date(monthData.year, monthData.month - 1, 1);
        if (monthDate < cutoffDate) {
          const docId = `${monthData.year}-${monthData.month.toString().padStart(2, '0')}`;
          // Note: You might want to archive instead of delete
          console.log(`Would delete old leaderboard: ${docId}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old leaderboards:', error);
    }
  }
}
