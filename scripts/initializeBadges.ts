// Run this script once to initialize badge explanations in your database
// You can run this from your browser console or create a simple page to execute it

import { BadgeExplanationService } from '@/lib/badgeExplanationService';

export async function initializeBadgeExplanations() {
  try {
    console.log('Initializing badge explanations...');
    await BadgeExplanationService.initializeBadgeExplanations();
    console.log('✅ Badge explanations initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing badge explanations:', error);
  }
}

// Uncomment the line below to run immediately
// initializeBadgeExplanations();
