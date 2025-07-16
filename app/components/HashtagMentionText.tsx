"use client";

import { useRouter } from "next/navigation";
import { MentionService } from "@/lib/mentionService";
import { UserService } from "@/lib/userService";

interface HashtagMentionTextProps {
  text: string;
  className?: string;
  onHashtagClick?: (hashtag: string) => void;
}

export default function HashtagMentionText({ 
  text, 
  className = "",
  onHashtagClick 
}: HashtagMentionTextProps) {
  const router = useRouter();

  const handleMentionClick = (username: string) => {
    // Navigate to user profile using nickname route
    router.push(`/user/${username}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    } else {
      router.push(`/hashtag/${encodeURIComponent(hashtag)}`);
    }
  };

  // Process text for both hashtags and mentions
  const processText = (inputText: string) => {
    // Split by both hashtags and mentions
    const parts = inputText.split(/(\#\w+|@\w+)/g);
    
    return parts.map((part, index) => {
      // Check if it's a hashtag
      if (part.match(/^#\w+$/)) {
        const hashtag = part.substring(1);
        return (
          <span
            key={index}
            className="text-accent font-medium cursor-pointer hover:underline"
            onClick={() => handleHashtagClick(hashtag)}
          >
            {part}
          </span>
        );
      }
      
      // Check if it's a mention
      if (part.match(/^@\w+$/)) {
        const username = part.substring(1);
        return (
          <span
            key={index}
            className="text-primary font-medium cursor-pointer hover:underline"
            onClick={() => handleMentionClick(username)}
          >
            {part}
          </span>
        );
      }
      
      // Regular text
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <span className={className}>
      {processText(text)}
    </span>
  );
}
