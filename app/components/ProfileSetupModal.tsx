"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { UserService } from "@/lib/userService";
import { getRandomAvatar, getAvatarById } from "../../types/user";
import AvatarSelector from "./AvatarSelector";
import NicknameInput from "./NicknameInput";
import toast from "react-hot-toast";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ isOpen, onComplete }: ProfileSetupModalProps) {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Initialize with random avatar and suggestions
  useEffect(() => {
    if (isOpen && user) {
      const randomAvatar = getRandomAvatar();
      setSelectedAvatarId(randomAvatar.id);
      
      const nicknameSuggestions = UserService.generateSuggestedNicknames(user.email || "");
      setSuggestions(nicknameSuggestions);
    }
  }, [isOpen, user]);

  const handleSubmit = async () => {
    if (!user || !nickname || (!selectedAvatarId && !customAvatarUrl)) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use custom avatar URL if available, otherwise use selected avatar ID
      const avatarToUse = customAvatarUrl || selectedAvatarId;

      await UserService.createUserProfile(
        user.uid,
        user.email || "",
        nickname,
        avatarToUse,
        bio
      );

      await refreshProfile();
      toast.success("Profile created successfully! Welcome to Snacx! 🎉");
      onComplete();
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast.error(error.message || "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!nickname || nickname.length < 3)) {
      toast.error("Please enter a valid nickname");
      return;
    }
    if (step === 2 && (!selectedAvatarId && !customAvatarUrl)) {
      toast.error("Please select an avatar");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-xl shadow-2xl border border-primary/20 w-full max-w-md max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
            <h2 className="text-xl sm:text-2xl font-bold">Welcome to Snacx!</h2>
            <p className="text-sm sm:text-base opacity-90 mt-1">
              Let's set up your anonymous profile
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4 flex space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    stepNum <= step ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Choose Your Nickname
                    </h3>
                    <p className="text-sm text-text-secondary">
                      This will be your identity on Snacx. Choose wisely!
                    </p>
                  </div>

                  <NicknameInput
                    value={nickname}
                    onChange={setNickname}
                    suggestions={suggestions}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Pick Your Avatar
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Choose an avatar that represents you
                    </p>
                  </div>

                  <AvatarSelector
                    selectedAvatarId={selectedAvatarId}
                    onAvatarSelect={(avatarId, customUrl) => {
                      setSelectedAvatarId(avatarId);
                      if (customUrl) {
                        setCustomAvatarUrl(customUrl);
                      } else {
                        setCustomAvatarUrl("");
                      }
                    }}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Tell Us About Yourself
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Write a short bio (optional)
                    </p>
                  </div>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="I love memes because..."
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    rows={4}
                    maxLength={200}
                  />
                  
                  <div className="text-right text-xs text-text-secondary">
                    {bio.length}/200
                  </div>

                  {/* Profile Preview */}
                  <div className="bg-secondary/50 rounded-lg p-4 border border-primary/10">
                    <h4 className="text-sm font-medium text-text-primary mb-3">Profile Preview:</h4>
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                        {customAvatarUrl ? (
                          <img
                            src={customAvatarUrl}
                            alt="Custom avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">
                            {selectedAvatarId ?
                              getAvatarById(selectedAvatarId)?.url || '🐱'
                              : '🐱'
                            }
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{nickname || "your_nickname"}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          {bio || "No bio yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-secondary/20">
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                disabled={step === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  step === 1
                    ? "bg-secondary text-text-secondary cursor-not-allowed"
                    : "bg-secondary text-text-primary hover:bg-secondary/80"
                }`}
              >
                Back
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={step === 3 ? handleSubmit : nextStep}
                disabled={isSubmitting ||
                  (step === 1 && (!nickname || nickname.length < 3)) ||
                  (step === 2 && (!selectedAvatarId && !customAvatarUrl))
                }
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>{step === 3 ? "Complete Setup" : "Next"}</span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
