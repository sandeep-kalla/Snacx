"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import AchievementNotification from "../components/AchievementNotification";

interface AchievementContextType {
  showAchievement: (achievementId: string) => void;
  hideAchievement: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function useAchievement() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error("useAchievement must be used within an AchievementProvider");
  }
  return context;
}

interface AchievementProviderProps {
  children: ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAchievement = useCallback((achievementId: string) => {
    setCurrentAchievement(achievementId);
    setIsVisible(true);
  }, []);

  const hideAchievement = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentAchievement(null);
    }, 300); // Wait for exit animation
  }, []);

  return (
    <AchievementContext.Provider value={{ showAchievement, hideAchievement }}>
      {children}
      {currentAchievement && (
        <AchievementNotification
          achievementId={currentAchievement}
          isVisible={isVisible}
          onClose={hideAchievement}
        />
      )}
    </AchievementContext.Provider>
  );
}
