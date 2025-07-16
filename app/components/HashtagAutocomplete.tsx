"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HashtagService } from "@/lib/hashtagService";
import { Hashtag } from "../../types/hashtag";
import HashtagChip from "./HashtagChip";

interface HashtagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function HashtagAutocomplete({
  value,
  onChange,
  placeholder = "Enter title with hashtags...",
  className = ""
}: HashtagAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Hashtag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      const handleSelectionChange = () => {
        setCursorPosition(input.selectionStart || 0);
      };
      
      input.addEventListener('selectionchange', handleSelectionChange);
      input.addEventListener('click', handleSelectionChange);
      input.addEventListener('keyup', handleSelectionChange);
      
      return () => {
        input.removeEventListener('selectionchange', handleSelectionChange);
        input.removeEventListener('click', handleSelectionChange);
        input.removeEventListener('keyup', handleSelectionChange);
      };
    }
  }, []);

  useEffect(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (hashtagMatch) {
      const hashtag = hashtagMatch[1];
      setCurrentHashtag(hashtag);
      
      if (hashtag.length > 0) {
        loadSuggestions(hashtag);
        setShowSuggestions(true);
      } else {
        loadPopularHashtags();
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
      setCurrentHashtag("");
    }
  }, [value, cursorPosition]);

  const loadSuggestions = async (searchTerm: string) => {
    try {
      const results = await HashtagService.searchHashtags(searchTerm, 10);
      setSuggestions(results);
    } catch (error) {
      console.error("Error loading hashtag suggestions:", error);
      setSuggestions([]);
    }
  };

  const loadPopularHashtags = async () => {
    try {
      const popular = await HashtagService.getPopularHashtags(8);
      setSuggestions(popular);
    } catch (error) {
      console.error("Error loading popular hashtags:", error);
      setSuggestions([]);
    }
  };

  const insertHashtag = (hashtag: string) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the start of the current hashtag
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    if (hashtagMatch) {
      const hashtagStart = textBeforeCursor.lastIndexOf('#');
      const newText = 
        value.substring(0, hashtagStart) + 
        `#${hashtag} ` + 
        textAfterCursor;
      
      onChange(newText);
      setShowSuggestions(false);
      
      // Set cursor position after the inserted hashtag
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = hashtagStart + hashtag.length + 2; // +2 for # and space
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertHashtag(suggestions[0].name);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart || 0);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${className}`}
      />
      
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs text-text-secondary mb-2 px-2">
                {currentHashtag ? `Hashtags matching "${currentHashtag}"` : "Popular hashtags"}
              </div>
              <div className="space-y-1">
                {suggestions.map((hashtag, index) => (
                  <motion.button
                    key={hashtag.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => insertHashtag(hashtag.name)}
                    className="w-full text-left p-2 rounded-md hover:bg-primary/10 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-primary font-medium">#{hashtag.name}</span>
                      {hashtag.trending && (
                        <span className="text-xs text-accent">🔥</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-secondary">
                        {hashtag.count} uses
                      </span>
                      <HashtagChip
                        hashtag={hashtag.name}
                        size="xs"
                        variant="outline"
                        showEmoji={true}
                        clickable={false}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {currentHashtag && suggestions.length === 0 && (
                <div className="p-4 text-center text-text-secondary">
                  <div className="text-sm">No hashtags found matching "{currentHashtag}"</div>
                  <div className="text-xs mt-1">You'll create a new hashtag!</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
