"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { HashtagService } from "@/lib/hashtagService";
import { UserService } from "@/lib/userService";
import { Hashtag } from "../../types/hashtag";
import { UserProfile, getAvatarById } from "../../types/user";
import HashtagChip from "./HashtagChip";

interface SearchResult {
  type: 'hashtag' | 'user';
  data: Hashtag | UserProfile;
}

interface HashtagSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (term: string, type: 'hashtag' | 'user') => void;
}

export default function HashtagSearch({
  placeholder = "Search hashtags or @users...",
  className = "",
  onSearch
}: HashtagSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.length > 0) {
        loadSuggestions(searchTerm);
      } else {
        loadPopularSuggestions();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadSuggestions = async (term: string) => {
    try {
      setIsLoading(true);
      const results: SearchResult[] = [];

      // Check if searching for users (starts with @)
      if (term.startsWith('@')) {
        const cleanTerm = term.slice(1); // Remove @
        const users = await UserService.searchUsersByNickname(cleanTerm, 5);
        results.push(...users.map(user => ({ type: 'user' as const, data: user })));
      }
      // Check if searching for hashtags (starts with #)
      else if (term.startsWith('#')) {
        const cleanTerm = term.slice(1); // Remove #
        const hashtags = await HashtagService.searchHashtags(cleanTerm, 5);
        results.push(...hashtags.map(hashtag => ({ type: 'hashtag' as const, data: hashtag })));
      }
      // Search both if no prefix
      else {
        const [hashtags, users] = await Promise.all([
          HashtagService.searchHashtags(term, 4),
          UserService.searchUsersByNickname(term, 4)
        ]);

        results.push(...hashtags.map(hashtag => ({ type: 'hashtag' as const, data: hashtag })));
        results.push(...users.map(user => ({ type: 'user' as const, data: user })));
      }

      setSuggestions(results);
    } catch (error) {
      console.error("Error loading search suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPopularSuggestions = async () => {
    try {
      setIsLoading(true);
      const [hashtags, users] = await Promise.all([
        HashtagService.getPopularHashtags(4),
        UserService.getActiveUsers(4)
      ]);

      const results: SearchResult[] = [
        ...hashtags.map(hashtag => ({ type: 'hashtag' as const, data: hashtag })),
        ...users.map(user => ({ type: 'user' as const, data: user }))
      ];

      setSuggestions(results);
    } catch (error) {
      console.error("Error loading popular suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (term: string, type: 'hashtag' | 'user') => {
    if (onSearch) {
      onSearch(term, type);
    } else {
      if (type === 'hashtag') {
        router.push(`/hashtag/${encodeURIComponent(term)}`);
      } else {
        // Find the user by nickname to get their userId
        try {
          const users = await UserService.searchUsersByNickname(term, 1);
          if (users.length > 0) {
            router.push(`/profile/${users[0].uid}`);
          } else {
            // Fallback to old route if user not found
            router.push(`/user/${encodeURIComponent(term)}`);
          }
        } catch (error) {
          console.error("Error finding user:", error);
          router.push(`/user/${encodeURIComponent(term)}`);
        }
      }
    }
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0];
        if (firstSuggestion.type === 'hashtag') {
          handleSearch((firstSuggestion.data as Hashtag).name, 'hashtag');
        } else {
          handleSearch((firstSuggestion.data as UserProfile).nickname, 'user');
        }
      } else if (searchTerm.trim()) {
        // Determine search type based on prefix
        if (searchTerm.startsWith('#')) {
          const cleanTerm = searchTerm.slice(1).trim();
          if (cleanTerm) handleSearch(cleanTerm, 'hashtag');
        } else if (searchTerm.startsWith('@')) {
          const cleanTerm = searchTerm.slice(1).trim();
          if (cleanTerm) handleSearch(cleanTerm, 'user');
        } else {
          // Default to hashtag search
          const cleanTerm = searchTerm.trim();
          if (cleanTerm) handleSearch(cleanTerm, 'hashtag');
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (searchTerm.length === 0) {
      loadPopularSuggestions();
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
          {searchTerm.startsWith('@') ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : searchTerm.startsWith('#') ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-3">
              <div className="text-xs text-text-secondary mb-3 px-1">
                {searchTerm.startsWith('@')
                  ? `Users matching "${searchTerm.slice(1)}"`
                  : searchTerm.startsWith('#')
                    ? `Hashtags matching "${searchTerm.slice(1)}"`
                    : searchTerm
                      ? `Results matching "${searchTerm}"`
                      : "Popular hashtags and users"}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                  {/* Group suggestions by type */}
                  {suggestions.some(s => s.type === 'hashtag') && (
                    <div className="mb-2">
                      <div className="text-xs text-text-secondary mb-2 px-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Hashtags
                      </div>
                      <div className="space-y-1">
                        {suggestions
                          .filter(s => s.type === 'hashtag')
                          .map((result, index) => {
                            const hashtag = result.data as Hashtag;
                            return (
                              <motion.button
                                key={`hashtag-${hashtag.id}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSearch(hashtag.name, 'hashtag')}
                                className="w-full text-left p-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between group border border-transparent hover:border-primary/20"
                              >
                                <div className="flex items-center space-x-3">
                                  <HashtagChip
                                    hashtag={hashtag.name}
                                    size="sm"
                                    variant="outline"
                                    showEmoji={true}
                                    clickable={false}
                                  />
                                  {hashtag.trending && (
                                    <span className="text-xs text-accent font-medium">🔥 Trending</span>
                                  )}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {hashtag.count} memes
                                </div>
                              </motion.button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Users */}
                  {suggestions.some(s => s.type === 'user') && (
                    <div>
                      <div className="text-xs text-text-secondary mb-2 px-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Users
                      </div>
                      <div className="space-y-1">
                        {suggestions
                          .filter(s => s.type === 'user')
                          .map((result, index) => {
                            const user = result.data as UserProfile;
                            return (
                              <motion.button
                                key={`user-${user.uid}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => router.push(`/profile/${user.uid}`)}
                                className="w-full text-left p-3 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between group border border-transparent hover:border-primary/20"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                                    {getAvatarById(user.avatar)?.url || user.avatar}
                                  </div>
                                  <div>
                                    <div className="font-medium text-text-primary">@{user.nickname}</div>
                                    <div className="text-xs text-text-secondary truncate max-w-[150px]">
                                      {user.bio || "No bio"}
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : searchTerm ? (
                <div className="p-4 text-center text-text-secondary">
                  <div className="text-sm">No results found matching "{searchTerm}"</div>
                  <button
                    onClick={() => {
                      const term = searchTerm.replace(/^[@#]/, '');
                      const type = searchTerm.startsWith('@') ? 'user' : 'hashtag';
                      handleSearch(term, type);
                    }}
                    className="text-xs mt-2 text-primary hover:underline"
                  >
                    Search anyway →
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-text-secondary text-sm">
                  <p>Start typing to search</p>
                  <p className="text-xs mt-1">Use # for hashtags or @ for users</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
