"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserService } from "@/lib/userService";
import { debounce } from "lodash";

interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  className?: string;
}

export default function NicknameInput({ 
  value, 
  onChange, 
  suggestions = [], 
  className = "" 
}: NicknameInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  // Debounced nickname availability check
  const checkNicknameAvailability = useCallback(
    debounce(async (nickname: string) => {
      if (!nickname || nickname.length < 3) {
        setIsAvailable(null);
        setError("");
        return;
      }

      setIsChecking(true);
      setError("");

      try {
        const available = await UserService.isNicknameAvailable(nickname);
        setIsAvailable(available);
        if (!available) {
          setError("This nickname is already taken");
        }
      } catch (error) {
        console.error("Error checking nickname:", error);
        // If it's a permission error, assume available and let the backend handle it
        if (error instanceof Error && error.message.includes('permission')) {
          setIsAvailable(true);
          setError("");
        } else {
          setError("Error checking nickname availability");
          setIsAvailable(null);
        }
      } finally {
        setIsChecking(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (value) {
      checkNicknameAvailability(value);
    } else {
      setIsAvailable(null);
      setError("");
    }
  }, [value, checkNicknameAvailability]);

  const validateNickname = (nickname: string): string => {
    if (!nickname) return "Nickname is required";
    if (nickname.length < 3) return "Nickname must be at least 3 characters";
    if (nickname.length > 20) return "Nickname must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) return "Nickname can only contain letters, numbers, and underscores";
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    onChange(newValue);
    
    const validationError = validateNickname(newValue);
    if (validationError) {
      setError(validationError);
      setIsAvailable(null);
    } else {
      setError("");
    }
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
        />
      );
    }
    
    if (error) {
      return (
        <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (isAvailable === true) {
      return (
        <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="Enter your nickname"
          className={`w-full px-4 py-3 pr-12 bg-card border rounded-lg text-text-primary placeholder-text-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            error 
              ? "border-error focus:border-error" 
              : isAvailable === true 
                ? "border-success focus:border-success" 
                : "border-border focus:border-primary"
          }`}
          maxLength={20}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Error/Success Message */}
      {(error || isAvailable === true) && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs sm:text-sm ${
            error ? "text-error" : "text-success"
          }`}
        >
          {error || "✓ Nickname is available!"}
        </motion.p>
      )}

      {/* Character Count */}
      <div className="flex justify-between items-center text-xs text-text-secondary">
        <span>3-20 characters, letters, numbers, and underscores only</span>
        <span className={value.length > 20 ? "text-error" : ""}>
          {value.length}/20
        </span>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !value && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <motion.button
                key={suggestion}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(suggestion)}
                className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 transition-all duration-200"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
