"use client";

import { motion } from "framer-motion";
import { useNotificationPreferences } from "../hooks/useRealTimeNotifications";
import { useAuth } from "../context/AuthContext";

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useNotificationPreferences(user?.uid || null);

  if (!user) {
    return null;
  }

  const notificationTypes = [
    {
      key: 'likes' as const,
      title: 'Likes',
      description: 'When someone likes your memes',
      icon: '❤️'
    },
    {
      key: 'comments' as const,
      title: 'Comments',
      description: 'When someone comments on your memes',
      icon: '💬'
    },
    {
      key: 'replies' as const,
      title: 'Replies',
      description: 'When someone replies to your comments',
      icon: '↩️'
    },
    {
      key: 'follows' as const,
      title: 'Follows',
      description: 'When someone follows you',
      icon: '👤'
    },
    {
      key: 'achievements' as const,
      title: 'Achievements',
      description: 'When you unlock new achievements',
      icon: '🏆'
    }
  ];

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-6 border border-border"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Notification Preferences
      </h3>
      <p className="text-sm text-text-secondary mb-6">
        Choose which notifications you'd like to receive
      </p>

      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <motion.div
            key={type.key}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{type.icon}</span>
              <div>
                <h4 className="font-medium text-foreground">{type.title}</h4>
                <p className="text-xs text-text-secondary">{type.description}</p>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggle(type.key)}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50
                ${preferences[type.key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
              `}
            >
              <motion.div
                animate={{
                  x: preferences[type.key] ? 24 : 2
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </motion.button>
          </motion.div>
        ))}

        {/* Sound Settings */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">🔊</span>
            <div>
              <h4 className="font-medium text-foreground">Sound Notifications</h4>
              <p className="text-xs text-text-secondary">Play sound when receiving notifications</p>
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleToggle('soundEnabled')}
            className={`
              relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50
              ${preferences.soundEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <motion.div
              animate={{
                x: preferences.soundEnabled ? 24 : 2
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </motion.div>

        {/* Email Notifications */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">📧</span>
            <div>
              <h4 className="font-medium text-foreground">Email Notifications</h4>
              <p className="text-xs text-text-secondary">Receive important notifications via email</p>
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleToggle('emailNotifications')}
            className={`
              relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50
              ${preferences.emailNotifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <motion.div
              animate={{
                x: preferences.emailNotifications ? 24 : 2
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </motion.div>
      </div>

      {/* Test Notification Button */}
      <motion.div
        className="mt-6 pt-4 border-t border-border"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // Create a test notification
            if (preferences.soundEnabled) {
              try {
                const audio = new Audio('/notification-sound.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {
                  // Ignore audio play errors
                });
              } catch (error) {
                // Ignore audio errors
              }
            }
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification('Test Notification', {
                body: 'This is how notifications will appear!',
                icon: '/favicon.ico'
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('Test Notification', {
                    body: 'This is how notifications will appear!',
                    icon: '/favicon.ico'
                  });
                }
              });
            }
          }}
          className="w-full bg-primary hover:bg-primary-dark text-primary-foreground py-2 px-4 rounded-lg transition-colors font-medium"
        >
          Test Notification
        </motion.button>
        
        <p className="text-xs text-text-secondary mt-2 text-center">
          Click to test your notification settings
        </p>
      </motion.div>

      {/* Browser Notification Permission */}
      {typeof window !== 'undefined' && Notification.permission === 'default' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Enable Browser Notifications
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Allow browser notifications to receive real-time alerts even when the tab is not active.
              </p>
              <button
                onClick={() => {
                  Notification.requestPermission();
                }}
                className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
