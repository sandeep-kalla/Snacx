"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { UserLevel } from "../../types/userLevel";
import LevelBadge from "./LevelBadge";

interface LevelUpNotificationProps {
  isVisible: boolean;
  newLevel: UserLevel;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function LevelUpNotification({
  isVisible,
  newLevel,
  onClose,
  autoClose = true,
  duration = 5000
}: LevelUpNotificationProps) {
  const [showPerks, setShowPerks] = useState(false);

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  useEffect(() => {
    if (isVisible) {
      // Show perks after a delay
      const timer = setTimeout(() => {
        setShowPerks(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setShowPerks(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-card rounded-2xl p-8 max-w-md w-full border-2 relative overflow-hidden"
            style={{ borderColor: newLevel.color }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(circle at center, ${newLevel.color} 0%, transparent 70%)`
              }}
            />

            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: newLevel.color,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.random() * 40 - 20, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              {/* Level Up Text */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="mb-6"
              >
                <h2 className="text-3xl font-bold text-text-primary mb-2">
                  🎉 LEVEL UP! 🎉
                </h2>
                <p className="text-text-secondary">
                  Congratulations! You've reached a new level!
                </p>
              </motion.div>

              {/* New Level Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <LevelBadge
                  level={newLevel}
                  size="xl"
                  showLevel={true}
                  showName={true}
                  animated={true}
                />
              </motion.div>

              {/* Level Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-6"
              >
                <p 
                  className="text-lg font-medium mb-2"
                  style={{ color: newLevel.color }}
                >
                  {newLevel.name}
                </p>
                <p className="text-text-secondary text-sm">
                  {newLevel.description}
                </p>
              </motion.div>

              {/* Perks */}
              <AnimatePresence>
                {showPerks && newLevel.perks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <h4 className="text-sm font-medium text-text-primary mb-3">
                      🎁 New Perks Unlocked:
                    </h4>
                    <div className="space-y-2">
                      {newLevel.perks.map((perk, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-2 text-sm text-text-secondary"
                        >
                          <span className="text-primary">✨</span>
                          <span>{perk}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: newLevel.color,
                  color: 'white'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Awesome!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
