import { Suspense } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Meme } from "@/types/meme";
import OptimizedMemeCard from "./OptimizedMemeCard";
import MemeCardSkeleton from "./MemeCardSkeleton";
import TrendingHashtags from "./TrendingHashtags";
import HashtagFilter from "./HashtagFilter";

// This is a server component for better performance
async function getInitialMemes(): Promise<Meme[]> {
  try {
    const q = query(
      collection(db, "memes"),
      orderBy("createdAt", "desc"),
      limit(12) // Load fewer items initially for faster FCP
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Meme)
    );
  } catch (error) {
    console.error("Error fetching initial memes:", error);
    return [];
  }
}

// Server component for trending hashtags
async function getTrendingHashtags(): Promise<string[]> {
  // This would be implemented based on your hashtag service
  // For now, returning static data
  return ["funny", "memes", "viral", "comedy", "trending"];
}

interface ServerMemeGridProps {
  selectedHashtags?: string[];
  feedType?: "explore" | "following";
}

export default async function ServerMemeGrid({
  selectedHashtags = [],
  feedType = "explore",
}: ServerMemeGridProps) {
  // Fetch data in parallel for better performance
  const [initialMemes, trendingHashtags] = await Promise.all([
    getInitialMemes(),
    getTrendingHashtags(),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 relative z-10">
      <div className="pb-4 sm:pb-6 border-b border-primary/20 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text">
          {feedType === "explore" ? "Explore Memes" : "Following Feed"}
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
          {feedType === "explore"
            ? "Discover the latest memes from the community"
            : "Latest memes from users you follow"}
        </p>
      </div>

      {/* Sidebar and Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        {/* Left Sidebar: Hashtag Filter */}
        <div className="lg:col-span-1">
          <Suspense
            fallback={
              <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
            }
          >
            <HashtagFilter
              selectedHashtags={selectedHashtags}
              onHashtagsChange={() => {}} // This will be handled by client component
              className="sticky top-24"
            />
          </Suspense>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Suspense fallback={<MemeGridSkeleton />}>
            <MemeGrid memes={initialMemes} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Client component for interactive meme grid
function MemeGrid({ memes }: { memes: Meme[] }) {
  if (memes.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-xl sm:text-2xl font-medium text-text-primary">
          No memes found
        </h3>
        <p className="mt-2 text-sm sm:text-base text-text-secondary">
          Be the first to share a meme with the community!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {memes.map((meme, index) => (
        <div
          key={meme.id}
          id={`meme-${meme.id}`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
          className="animate-fadeInUp"
        >
          <OptimizedMemeCard {...meme} />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for the meme grid
function MemeGridSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MemeCardSkeleton key={i} />
      ))}
    </div>
  );
}
