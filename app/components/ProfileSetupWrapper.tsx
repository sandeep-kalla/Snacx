"use client";

import { useAuth } from "../context/AuthContext";
import ProfileSetupModal from "./ProfileSetupModal";

export default function ProfileSetupWrapper() {
  const { user, needsProfileSetup, refreshProfile } = useAuth();

  const handleProfileComplete = () => {
    refreshProfile();
  };

  return (
    <ProfileSetupModal
      isOpen={!!user && needsProfileSetup}
      onComplete={handleProfileComplete}
    />
  );
}
