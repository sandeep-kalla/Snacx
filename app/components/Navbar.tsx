"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getAvatarById } from "@/types/user";
import HashtagSearch from "./HashtagSearch";
import NotificationBell from "./NotificationBell";
import { useRouter } from "next/navigation";
import { useUnreadMessages } from "../hooks/useUnreadMessages";


export default function Navbar() {
  const { user, userProfile, signInWithGoogle, signOut, isAuthLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, markAllAsRead } = useUnreadMessages();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerMenuRef = useRef<HTMLDivElement>(null);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Failed to sign in:", error);
    }
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (hamburgerMenuRef.current && !hamburgerMenuRef.current.contains(event.target as Node)) {
        setHamburgerMenuOpen(false);
      }
    }

    if (profileMenuOpen || hamburgerMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen, hamburgerMenuOpen]);

  // Main navigation items (only Explore and Trending in main nav)
  const mainNavItems = [
    { name: "Explore", path: "/", requiresAuth: false },
    { name: "Trending", path: "/trending", requiresAuth: false },
  ];

  // Hamburger menu items (all other pages)
  const menuItems = [
    { name: "Following", path: "/following", requiresAuth: true, icon: "👥" },
    { name: "Upload", path: "/upload", requiresAuth: true, icon: "📤" },
    { name: "My Memes", path: "/my-memes", requiresAuth: true, icon: "🖼️" },
    { name: "Achievements", path: "/achievements", requiresAuth: true, icon: "🏆" },
    { name: "Leaderboard", path: "/leaderboard", requiresAuth: false, icon: "📊" },
    { name: "How It Works", path: "/info", requiresAuth: false, icon: "📚" },
    { name: "Settings", path: "/settings", requiresAuth: true, icon: "⚙️" },
  ];

  return (
    <>
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-md border-b border-primary/20 shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center group">
            <div className="mr-3 relative w-12 h-12 sm:w-14 sm:h-14">
              <Image
                src="/snacc-logo.svg"
                alt="Snacx Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text"
            >
              Snacx
            </motion.span>
          </Link>

          {/* Center: Main Navigation (Explore & Trending) */}
          <div className="hidden md:flex items-center space-x-8">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? "text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Center-Right: Hashtag Search */}
          <div className="hidden md:block mx-4 w-64">
            <HashtagSearch
              placeholder="Search by #hashtag..."
              className="w-full"
            />
          </div>

          {/* Right: Chat, Notifications, Hamburger Menu, Theme Toggle, Profile */}
          <div className="flex items-center space-x-3">

            {/* Chat */}
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  markAllAsRead(); // Immediately hide the red dot
                  router.push('/chat');
                }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors relative"
                aria-label="Open chat"
              >
                <span className="text-lg">💬</span>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 border-2 border-background"></div>
                )}
              </motion.button>
            )}

            {/* Notifications */}
            {user && <NotificationBell />}



            {/* Hamburger Menu */}
            <div className="relative" ref={hamburgerMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHamburgerMenuOpen(!hamburgerMenuOpen)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <motion.div
                    animate={hamburgerMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                    className="w-5 h-0.5 bg-text-primary mb-1 transition-all"
                  />
                  <motion.div
                    animate={hamburgerMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                    className="w-5 h-0.5 bg-text-primary mb-1 transition-all"
                  />
                  <motion.div
                    animate={hamburgerMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                    className="w-5 h-0.5 bg-text-primary transition-all"
                  />
                </div>
              </motion.button>

              {/* Hamburger Menu Dropdown */}
              <AnimatePresence>
                {hamburgerMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-card/95 backdrop-blur-sm rounded-xl shadow-xl border border-primary/20 py-2 z-50"
                  >
                    {menuItems.map((item) => {
                      if (item.requiresAuth && !user) return null;
                      
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setHamburgerMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </motion.button>

            {/* Profile */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  {userProfile ? (
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center overflow-hidden">
                      {userProfile.avatar.startsWith('http') ? (
                        <img
                          src={userProfile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {getAvatarById(userProfile.avatar)?.url || '🐱'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                  )}
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-card/95 backdrop-blur-sm rounded-xl shadow-xl border border-primary/20 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-primary/10">
                        <p className="text-sm font-medium text-text-primary">
                          {userProfile?.nickname || user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-text-secondary">{user.email}</p>
                      </div>
                      
                      <Link
                        href={`/profile/${user.uid}`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <span>👤</span>
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <span>⚙️</span>
                        <span>Settings</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                disabled={isAuthLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {isAuthLoading ? "Signing in..." : "Sign In"}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>


    </>
  );
}
