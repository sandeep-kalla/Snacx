"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MonthlyLeaderboardService } from "@/lib/monthlyLeaderboardService";
import { TopPerformersData } from "@/types/follow";
import { getAvatarById } from "@/types/user";
import { useRouter } from "next/navigation";

export default function TopPerformersBanner() {
  const router = useRouter();
  const [topPerformers, setTopPerformers] = useState<TopPerformersData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndLoadTopPerformers = async () => {
      try {
        // Check if we should show the banner
        const shouldShow = MonthlyLeaderboardService.shouldShowBanner();
        
        if (!shouldShow) {
          setLoading(false);
          return;
        }

        // Check if user has dismissed it today
        const today = new Date().toDateString();
        const dismissedToday = localStorage.getItem('topPerformersBannerDismissed') === today;
        
        if (dismissedToday) {
          setLoading(false);
          return;
        }

        // Load previous month's top performers
        const performers = await MonthlyLeaderboardService.getPreviousMonthTopPerformers();
        
        if (performers && performers.performers.length > 0) {
          setTopPerformers(performers);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error loading top performers:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAndLoadTopPerformers();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    
    // Remember dismissal for today
    const today = new Date().toDateString();
    localStorage.setItem('topPerformersBannerDismissed', today);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-600 to-amber-800';
      default: return 'from-primary to-primary-dark';
    }
  };

  if (loading || !isVisible || !topPerformers || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="relative bg-gradient-to-r from-purple-600 via-primary to-blue-600 text-white shadow-lg"
      >
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-2xl sm:text-3xl font-bold mb-2"
                >
                  🏆 Top Performers of {getMonthName(topPerformers.month)} {topPerformers.year} 🏆
                </motion.h2>
                <p className="text-sm sm:text-base opacity-90">
                  Congratulations to our amazing community leaders!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {topPerformers.performers.map((performer, index) => (
                  <motion.div
                    key={performer.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleViewProfile(performer.userId)}
                    className="cursor-pointer group"
                  >
                    <div className={`
                      relative bg-gradient-to-br ${getRankColor(performer.rank)} 
                      rounded-xl p-4 sm:p-6 shadow-lg transform transition-all duration-300 
                      group-hover:scale-105 group-hover:shadow-xl
                      ${performer.rank === 1 ? 'ring-4 ring-yellow-300/50' : ''}
                    `}>
                      {/* Rank Badge */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-lg">{getRankEmoji(performer.rank)}</span>
                      </div>

                      {/* Avatar */}
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center 
                          text-2xl sm:text-3xl mb-3 ring-4 ring-white/30 overflow-hidden
                          ${performer.rank === 1 ? 'ring-yellow-300' : ''}
                        `}>
                          {performer.avatar.startsWith('http') ? (
                            <img
                              src={performer.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{getAvatarById(performer.avatar)?.url || '🐱'}</span>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="font-bold text-lg sm:text-xl mb-1 truncate max-w-full">
                          {performer.nickname}
                        </h3>

                        {/* Rank */}
                        <div className="text-sm sm:text-base opacity-90 mb-2">
                          #{performer.rank} Place
                        </div>

                        {/* Score */}
                        <div className="bg-white/20 rounded-full px-3 py-1">
                          <span className="text-sm sm:text-base font-semibold">
                            {performer.score.toLocaleString()} pts
                          </span>
                        </div>

                        {/* Hover Effect */}
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs sm:text-sm bg-white/20 rounded-full px-2 py-1">
                            View Profile →
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Call to Action */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-6"
              >
                <p className="text-sm sm:text-base opacity-90 mb-3">
                  Think you can make it to the top? Start creating amazing memes today!
                </p>
                <button
                  onClick={() => router.push('/upload')}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  Upload Your Meme
                </button>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full"></div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
