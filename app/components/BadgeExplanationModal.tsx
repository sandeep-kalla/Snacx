"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeExplanationService, BadgeExplanation } from "@/lib/badgeExplanationService";

interface BadgeExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeId?: string;
  showAllBadges?: boolean;
}

export default function BadgeExplanationModal({
  isOpen,
  onClose,
  badgeId,
  showAllBadges = false
}: BadgeExplanationModalProps) {
  const [badge, setBadge] = useState<BadgeExplanation | null>(null);
  const [allBadges, setAllBadges] = useState<BadgeExplanation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'level' | 'achievement' | 'special'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadgeData = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        if (showAllBadges) {
          const badges = await BadgeExplanationService.getAllBadgeExplanations();
          setAllBadges(badges);
        } else if (badgeId) {
          const badgeData = await BadgeExplanationService.getBadgeExplanation(badgeId);
          setBadge(badgeData);
        }
      } catch (error) {
        console.error('Error loading badge data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadgeData();
  }, [isOpen, badgeId, showAllBadges]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'rare': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'epic': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'level': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'achievement': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'special': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const filteredBadges = allBadges.filter(badge => 
    selectedCategory === 'all' || badge.category === selectedCategory
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {showAllBadges ? 'Badge Collection' : 'Badge Details'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                />
              </div>
            ) : showAllBadges ? (
              <div>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['all', 'level', 'achievement', 'special'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-background border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl">{badge.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {badge.name}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            {badge.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(badge.category)}`}>
                              {badge.category}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                              {badge.rarity}
                            </span>
                          </div>

                          <p className="text-xs text-text-secondary mt-2">
                            {badge.requirements}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredBadges.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-text-secondary">No badges found in this category</p>
                  </div>
                )}
              </div>
            ) : badge ? (
              <div className="text-center">
                {/* Badge Display */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-block mb-6"
                >
                  <div 
                    className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-2xl ${
                      badge.gradient ? `bg-gradient-to-br ${badge.gradient}` : ''
                    }`}
                    style={{ backgroundColor: badge.gradient ? undefined : badge.color }}
                  >
                    {badge.icon}
                  </div>
                </motion.div>

                {/* Badge Info */}
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {badge.name}
                </h3>
                
                <p className="text-lg text-text-secondary mb-6 max-w-md mx-auto">
                  {badge.description}
                </p>

                {/* Badge Details */}
                <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-auto">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Category:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(badge.category)}`}>
                        {badge.category}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Rarity:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </span>
                    </div>

                    {badge.xpValue !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">XP Value:</span>
                        <span className="font-semibold text-foreground">{badge.xpValue} XP</span>
                      </div>
                    )}

                    {badge.levelRequired && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Level Required:</span>
                        <span className="font-semibold text-foreground">Level {badge.levelRequired}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-2">Requirements:</h4>
                      <p className="text-sm text-text-secondary">{badge.requirements}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">❓</div>
                <p className="text-text-secondary">Badge not found</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
