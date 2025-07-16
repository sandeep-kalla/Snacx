"use client";

import { useRouter } from "next/navigation";
import { MentionService } from "@/lib/mentionService";

interface MentionTextProps {
  text: string;
  className?: string;
}

export default function MentionText({ text, className = "" }: MentionTextProps) {
  const router = useRouter();

  const mentionParts = MentionService.getMentionParts(text);

  const handleMentionClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  return (
    <span className={className}>
      {mentionParts.map((part, index) => {
        if (part.isMention && part.username) {
          return (
            <span
              key={index}
              className="text-primary font-medium cursor-pointer hover:underline"
              onClick={() => handleMentionClick(part.username!)}
            >
              {part.text}
            </span>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </span>
  );
}
