"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AchievementNotification from "../components/AchievementNotification";

interface NotificationContextType {
  showAchievementNotification: (achievementId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [achievementNotification, setAchievementNotification] = useState<{
    achievementId: string;
    isVisible: boolean;
  }>({ achievementId: '', isVisible: false });

  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({ message: '', type: 'info', isVisible: false });

  const showAchievementNotification = (achievementId: string) => {
    setAchievementNotification({
      achievementId,
      isVisible: true
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastNotification({
      message,
      type,
      isVisible: true
    });
  };

  const closeAchievementNotification = () => {
    setAchievementNotification(prev => ({ ...prev, isVisible: false }));
  };

  const closeToastNotification = () => {
    setToastNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Listen for achievement unlock events
  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent) => {
      const { achievementId } = event.detail;
      showAchievementNotification(achievementId);
    };

    window.addEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener);

    return () => {
      window.removeEventListener('achievementUnlocked', handleAchievementUnlocked as EventListener);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{
      showAchievementNotification,
      showToast
    }}>
      {children}
      
      {/* Achievement Notification */}
      {achievementNotification.achievementId && (
        <AchievementNotification
          achievementId={achievementNotification.achievementId}
          isVisible={achievementNotification.isVisible}
          onClose={closeAchievementNotification}
          autoHideDuration={5000}
        />
      )}

      {/* Toast Notification */}
      {toastNotification.isVisible && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`
            px-4 py-2 rounded-lg shadow-lg text-white font-medium
            ${toastNotification.type === 'success' ? 'bg-green-500' : 
              toastNotification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
          `}>
            {toastNotification.message}
            <button
              onClick={closeToastNotification}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
