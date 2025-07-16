import { ContentCountService } from './contentCountService';
import { AchievementService } from './achievementService';
import { XPService } from './xpService';

export class DebugService {
  
  // Debug user's current stats
  static async debugUserStats(userId: string): Promise<void> {
    console.log('=== DEBUG USER STATS ===');
    console.log('User ID:', userId);
    
    try {
      // Get active content stats
      const activeStats = await ContentCountService.getUserActiveStats(userId);
      console.log('Active Stats:', activeStats);
      
      // Get XP data
      const xpData = await XPService.getUserXP(userId);
      console.log('XP Data:', xpData);
      
      // Get achievements
      const achievements = await AchievementService.getUserAchievements(userId);
      console.log('Achievements:', achievements.length, 'unlocked');
      achievements.forEach(a => console.log('- ', a.achievementId));
      
      // Get achievement progress
      const progress = await AchievementService.getAchievementProgress(userId);
      console.log('Achievement Progress:', progress.length, 'tracked');
      
    } catch (error) {
      console.error('Debug error:', error);
    }
    
    console.log('=== END DEBUG ===');
  }
  
  // Test achievement system
  static async testAchievementSystem(userId: string): Promise<void> {
    console.log('=== TESTING ACHIEVEMENT SYSTEM ===');
    
    try {
      // Test first meme achievement
      const hasFirstMeme = await AchievementService.hasAchievement(userId, 'first_steps');
      console.log('Has First Steps achievement:', hasFirstMeme);
      
      // Test active meme count
      const activeMemes = await ContentCountService.getActiveMemeCount(userId);
      console.log('Active memes count:', activeMemes);
      
      // Test if user has ever uploaded
      const hasEverUploaded = await ContentCountService.hasEverUploadedMeme(userId);
      console.log('Has ever uploaded:', hasEverUploaded);
      
    } catch (error) {
      console.error('Test error:', error);
    }
    
    console.log('=== END TEST ===');
  }
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).DebugService = DebugService;
}
