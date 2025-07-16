"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { UserService } from "@/lib/userService";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getAvatarById } from "../../types/user";
import AvatarSelector from "../components/AvatarSelector";
import AdminManagement from "../components/AdminManagement";
import NotificationPreferences from "../components/NotificationPreferences";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { isAdmin, hasPermission } = useAdmin();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (userProfile) {
      setSelectedAvatar(userProfile.avatar || "");
      // Check if avatar is a custom URL (starts with http)
      if (userProfile.avatar && userProfile.avatar.startsWith('http')) {
        setCustomAvatarUrl(userProfile.avatar);
      }
      setBio(userProfile.bio || "");
    }
  }, [user, userProfile, router]);

  const handleSave = async () => {
    if (!user || !userProfile) return;

    if (!selectedAvatar && !customAvatarUrl) {
      toast.error("Please select an avatar");
      return;
    }

    setSaving(true);

    try {
      // Use custom URL if available, otherwise use selected avatar ID
      const avatarToSave = customAvatarUrl || selectedAvatar;

      await UserService.updateUserProfile(user.uid, {
        avatar: avatarToSave,
        bio: bio.trim(),
      });

      await refreshProfile();
      toast.success("Profile updated successfully! 🎉");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (avatarId: string, customUrl?: string) => {
    if (customUrl) {
      setCustomAvatarUrl(customUrl);
      setSelectedAvatar("custom");
    } else {
      setSelectedAvatar(avatarId);
      setCustomAvatarUrl("");
    }
  };

  if (!user) {
    return null;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-6 sm:py-12 px-3 sm:px-4"
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-card p-6 sm:p-8 rounded-xl shadow-xl border border-primary/20"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Profile Settings
            </h1>
            <p className="text-text-secondary">
              Update your avatar and bio
            </p>
          </div>

          {/* Profile Preview */}
          <div className="mb-8 p-4 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {selectedAvatar || customAvatarUrl || bio ? "Preview" : "Current Profile"}
            </h3>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl overflow-hidden">
                {customAvatarUrl ? (
                  <img
                    src={customAvatarUrl}
                    alt="Custom avatar"
                    className="w-full h-full object-cover"
                  />
                ) : selectedAvatar ? (
                  getAvatarById(selectedAvatar)?.url || '🐱'
                ) : userProfile.avatar && userProfile.avatar.startsWith('http') ? (
                  <img
                    src={userProfile.avatar}
                    alt="Current avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getAvatarById(userProfile.avatar)?.url || '🐱'
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {userProfile.nickname}
                </p>
                <p className="text-sm text-text-secondary">{userProfile.email}</p>
                {(bio.trim() || userProfile.bio) && (
                  <p className="text-sm text-text-secondary mt-1">
                    {bio.trim() || userProfile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Current Nickname Display */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nickname (Cannot be changed)
              </label>
              <div className="w-full bg-secondary/50 text-foreground rounded-lg px-4 py-3 text-base border border-primary/10">
                {userProfile.nickname}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Nicknames are permanent and cannot be modified
              </p>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Choose Avatar
              </label>

              <AvatarSelector
                selectedAvatarId={selectedAvatar}
                onAvatarSelect={handleAvatarSelect}
                className="w-full"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full bg-input text-foreground placeholder-text-secondary rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 border border-primary/20 resize-none"
                maxLength={150}
              />
              <p className="text-xs text-text-secondary mt-1">
                {bio.length}/150 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.back()}
                className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/80 text-foreground py-3 px-6 rounded-lg transition-colors font-medium"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Notification Preferences Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-6"
        >
          <NotificationPreferences />
        </motion.div>

        {/* Admin Management Section */}
        {isAdmin && hasPermission('manage_admins') && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6"
          >
            <AdminManagement />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
