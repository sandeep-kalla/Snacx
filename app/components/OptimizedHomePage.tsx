import { Suspense } from "react";
import ServerMemeGrid from "./ServerMemeGrid";
import TrendingHashtags from "./TrendingHashtags";

// This is now a server component for better performance
export default function OptimizedHomePage() {
  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="pb-4 sm:pb-6 border-b border-primary/20 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-accent text-transparent bg-clip-text">
            Explore Memes
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
            Discover the latest memes from the community
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          {/* Left Sidebar: Trending Hashtags */}
          <div className="lg:col-span-1">
            <Suspense
              fallback={
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
              }
            >
              <TrendingHashtags className="sticky top-24" />
            </Suspense>
          </div>

          {/* Main Content: Meme Grid */}
          <div className="lg:col-span-3">
            <Suspense
              fallback={
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square"
                    ></div>
                  ))}
                </div>
              }
            >
              <ServerMemeGrid feedType="explore" />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export metadata for better SEO
export const metadata = {
  title: "Explore Memes - Snacx",
  description: "Discover the latest and funniest memes from our community",
};
