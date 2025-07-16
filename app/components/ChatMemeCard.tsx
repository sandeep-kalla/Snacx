"use client";

import { CldImage } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

interface ChatMemeCardProps {
  memeId: string;
  title: string;
  imageUrl: string;
  authorName: string;
  publicId?: string;
}

export default function ChatMemeCard({
  memeId,
  title,
  imageUrl,
  authorName,
  publicId
}: ChatMemeCardProps) {
  const router = useRouter();
  const [cloudinaryFailed, setCloudinaryFailed] = useState(false);

  const handleCardClick = () => {
    // Navigate to the meme detail page
    router.push(`/meme/${memeId}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="bg-card border border-border rounded-lg p-2 cursor-pointer hover:border-primary/50 transition-all duration-200 max-w-sm"
    >
      <div className="flex items-center space-x-3">
        {/* Small Meme Image */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          {publicId && !cloudinaryFailed ? (
            <CldImage
              src={publicId}
              alt={title}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              sizes="48px"
              onError={(e) => {
                console.log('Cloudinary image failed for publicId:', publicId, 'falling back to imageUrl');
                setCloudinaryFailed(true);
                // Prevent the error from bubbling up
                e.preventDefault();
              }}
            />
          ) : (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                console.log('Image failed to load:', imageUrl);
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI4IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
              }}
            />
          )}
        </div>

        {/* Meme Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm line-clamp-1">
            {title}
          </h4>
          <p className="text-xs text-text-secondary">
            by {authorName}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-primary">Tap to view</span>
            <svg
              className="w-3 h-3 text-primary ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
