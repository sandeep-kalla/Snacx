import { useState, useEffect, useCallback } from 'react';
import { Meme } from '@/types/meme';

interface UseOptimizedMemesOptions {
  limit?: number;
  hashtags?: string[];
  enabled?: boolean;
}

interface UseOptimizedMemesReturn {
  memes: Meme[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useOptimizedMemes({
  limit = 20,
  hashtags = [],
  enabled = true
}: UseOptimizedMemesOptions = {}): UseOptimizedMemesReturn {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchMemes = useCallback(async (isLoadMore = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(hashtags.length > 0 && { hashtags: hashtags.join(',') }),
        ...(isLoadMore && cursor && { cursor })
      });

      const response = await fetch(`/api/memes?${params}`, {
        // Enable caching
        next: { revalidate: 60 }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch memes');
      }

      const data = await response.json();

      if (isLoadMore) {
        setMemes(prev => [...prev, ...data.memes]);
      } else {
        setMemes(data.memes);
      }

      setHasMore(data.hasMore);
      setCursor(data.cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memes');
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, hashtags, cursor]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMemes(true);
  }, [hasMore, loading, fetchMemes]);

  const refresh = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    await fetchMemes(false);
  }, [fetchMemes]);

  useEffect(() => {
    refresh();
  }, [hashtags]); // Refresh when hashtags change

  return {
    memes,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}

// Hook for optimized follow operations
interface UseOptimizedFollowOptions {
  targetUserId: string;
  enabled?: boolean;
}

interface UseOptimizedFollowReturn {
  isFollowing: boolean;
  followersCount: number;
  loading: boolean;
  toggleFollow: () => Promise<void>;
}

export function useOptimizedFollow({
  targetUserId,
  enabled = true
}: UseOptimizedFollowOptions): UseOptimizedFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchFollowStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      // This would need the current user ID - you'd get this from your auth context
      const response = await fetch(`/api/follow?followerId=USER_ID&followingId=${targetUserId}`, {
        next: { revalidate: 30 }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  }, [targetUserId, enabled]);

  const toggleFollow = useCallback(async () => {
    setLoading(true);
    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: 'USER_ID', // This would come from auth context
          followingId: targetUserId,
          action
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  }, [isFollowing, targetUserId]);

  useEffect(() => {
    fetchFollowStatus();
  }, [fetchFollowStatus]);

  return {
    isFollowing,
    followersCount,
    loading,
    toggleFollow
  };
}
