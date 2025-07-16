"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide splash screen after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500); // Show for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary rounded-full animate-pulse"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-accent rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-20 left-32 w-24 h-24 bg-primary-light rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-32 right-10 w-12 h-12 bg-accent rounded-full animate-pulse delay-500"></div>
          </div>

          {/* Main Content */}
          <div className="relative flex flex-col items-center space-y-8">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 1.2,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 sm:w-40 sm:h-40"
              >
                <Image
                  src="/snacc-logo.svg"
                  alt="Snacx Logo"
                  width={160}
                  height={160}
                  className="object-contain drop-shadow-2xl"
                />
              </motion.div>
              
              {/* Glow Effect */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              />
            </motion.div>

            {/* App Name Animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8,
                duration: 0.8,
                ease: "easeOut"
              }}
              className="text-center"
            >
              <motion.h1
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(139, 69, 19, 0.3)",
                    "0 0 40px rgba(139, 69, 19, 0.5)",
                    "0 0 20px rgba(139, 69, 19, 0.3)"
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-6xl sm:text-8xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text"
              >
                Snacx
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-lg sm:text-xl text-text-secondary mt-4 font-medium"
              >
                Share Your Funniest Memes
              </motion.p>
            </motion.div>

            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 bg-primary rounded-full"
                />
              ))}
            </motion.div>
          </div>

          {/* Sparkle Effects */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 text-4xl"
          >
            ✨
          </motion.div>
          
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "linear",
              delay: 1
            }}
            className="absolute bottom-20 left-20 text-3xl"
          >
            🍪
          </motion.div>

          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute top-32 left-1/4 text-2xl"
          >
            😂
          </motion.div>

          <motion.div
            animate={{ 
              y: [0, 15, 0],
              x: [0, 10, 0]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
            className="absolute bottom-32 right-1/4 text-2xl"
          >
            🎉
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
