"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AVAILABLE_AVATARS, AVATAR_CATEGORIES, Avatar } from "../../types/user";
import { CldUploadWidget } from "next-cloudinary";

interface AvatarSelectorProps {
  selectedAvatarId: string;
  onAvatarSelect: (avatarId: string, customUrl?: string) => void;
  className?: string;
}

export default function AvatarSelector({
  selectedAvatarId,
  onAvatarSelect,
  className = ""
}: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof AVATAR_CATEGORIES>('animals');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const filteredAvatars = AVAILABLE_AVATARS.filter(avatar => avatar.category === selectedCategory);
  const selectedAvatar = AVAILABLE_AVATARS.find(avatar => avatar.id === selectedAvatarId);

  const displayAvatar = isCustomSelected && customAvatarUrl ? customAvatarUrl : selectedAvatar?.url || '🐱';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Avatar Display */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full border-2 border-primary/20 mb-2 overflow-hidden">
          {isCustomSelected && customAvatarUrl ? (
            <img
              src={customAvatarUrl}
              alt="Custom avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">{selectedAvatar?.url || '🐱'}</span>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          {isCustomSelected && customAvatarUrl ? 'Custom Avatar' : selectedAvatar?.name || 'Select an avatar'}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(AVATAR_CATEGORIES).map(([key, label]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedCategory(key as keyof typeof AVATAR_CATEGORIES);
              setIsCustomSelected(false);
            }}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              selectedCategory === key && !isCustomSelected
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-secondary text-text-secondary hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {label}
          </motion.button>
        ))}

        {/* Custom Upload Tab */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCustomSelected(true)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
            isCustomSelected
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "bg-secondary text-text-secondary hover:bg-primary/10 hover:text-primary"
          }`}
        >
          📷 Custom
        </motion.button>
      </div>

      {/* Avatar Grid or Custom Upload */}
      <AnimatePresence mode="wait">
        {isCustomSelected ? (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center py-8"
          >
            <CldUploadWidget
              uploadPreset="meme-preset" // Using meme-preset for now, consider creating avatar-specific preset
              options={{
                maxFiles: 1,
                resourceType: "image",
                clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
                maxFileSize: 2000000, // 2MB
                cropping: true,
                croppingAspectRatio: 1,
                croppingShowDimensions: true,
                folder: "avatars",
              }}
              onSuccess={(result: any) => {
                if (result.event === "success") {
                  setCustomAvatarUrl(result.info.secure_url);
                  onAvatarSelect("custom", result.info.secure_url);
                }
              }}
            >
              {({ open }) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => open()}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg font-medium transition-all duration-200 shadow-lg shadow-primary/20"
                >
                  📷 Upload Custom Avatar
                </motion.button>
              )}
            </CldUploadWidget>

            {customAvatarUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4"
              >
                <p className="text-sm text-success mb-2">✓ Custom avatar uploaded!</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCustomAvatarUrl("");
                    setIsCustomSelected(false);
                    setSelectedCategory('animals');
                  }}
                  className="text-xs text-text-secondary hover:text-primary underline"
                >
                  Choose a different avatar
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar"
          >
            {filteredAvatars.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsCustomSelected(false);
                  setCustomAvatarUrl("");
                  onAvatarSelect(avatar.id);
                }}
                className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  selectedAvatarId === avatar.id && !isCustomSelected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-border hover:border-primary/50 bg-card hover:bg-primary/5"
                }`}
                title={avatar.name}
              >
                <span className="text-xl">{avatar.url}</span>
                {selectedAvatarId === avatar.id && !isCustomSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Random Avatar Button */}
      {!isCustomSelected && (
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const randomAvatar = AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)];
              setIsCustomSelected(false);
              setCustomAvatarUrl("");
              onAvatarSelect(randomAvatar.id);
              setSelectedCategory(randomAvatar.category);
            }}
            className="text-xs sm:text-sm text-primary hover:text-primary-light transition-colors underline"
          >
            🎲 Pick Random Avatar
          </motion.button>
        </div>
      )}
    </div>
  );
}
