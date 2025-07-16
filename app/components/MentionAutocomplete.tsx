"use client";

import { useState, useEffect, useRef } from "react";
import { MentionService } from "@/lib/mentionService";
import { getAvatarById } from "../../types/user";

interface MentionAutocompleteProps {
  text: string;
  onTextChange: (text: string) => void;
  currentUserId: string;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

interface UserSuggestion {
  uid: string;
  nickname: string;
  avatar: string;
}

export default function MentionAutocomplete({
  text,
  onTextChange,
  currentUserId,
  placeholder = "Type a message...",
  className = "",
  onSubmit
}: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Detect @ mentions and show autocomplete
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're still in a mention (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionStart(lastAtIndex);
        setMentionQuery(textAfterAt);
        
        // Search for users if query is not empty
        if (textAfterAt.length > 0) {
          searchUsers(textAfterAt);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [text, currentUserId]);

  const searchUsers = async (query: string) => {
    try {
      const users = await MentionService.searchUsersForMention(query, currentUserId);
      setSuggestions(users);
      setShowSuggestions(users.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const insertMention = (user: UserSuggestion) => {
    if (mentionStart === -1) return;

    const beforeMention = text.substring(0, mentionStart);
    const afterMention = text.substring(mentionStart + mentionQuery.length + 1);
    
    const newText = `${beforeMention}@${user.nickname} ${afterMention}`;
    onTextChange(newText);
    
    setShowSuggestions(false);
    
    // Focus back to textarea and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = mentionStart + user.nickname.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-none ${className}`}
        rows={1}
        style={{ minHeight: '40px', maxHeight: '120px' }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mb-1"
        >
          {suggestions.map((user, index) => (
            <div
              key={user.uid}
              onClick={() => insertMention(user)}
              className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-primary/10' : 'hover:bg-secondary'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {user.avatar.startsWith('http') ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm">
                    {getAvatarById(user.avatar)?.url || '🐱'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">@{user.nickname}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
