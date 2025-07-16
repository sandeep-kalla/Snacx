"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  onSnapshot, 
  collection,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MemeData {
  id: string;
  likes: string[];
  comments: any[];
  views: number;
  [key: string]: any;
}

interface UseRealTimeMemeReturn {
  meme: MemeData | null;
  loading: boolean;
  error: string | null;
}

// Hook for real-time meme updates
export function useRealTimeMeme(memeId: string | null): UseRealTimeMemeReturn {
  const [meme, setMeme] = useState<MemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memeId) {
      setMeme(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const memeRef = doc(db, 'memes', memeId);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      memeRef,
      (doc) => {
        if (doc.exists()) {
          setMeme({
            id: doc.id,
            ...doc.data()
          } as MemeData);
        } else {
          setMeme(null);
          setError('Meme not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to meme updates:', error);
        setError('Failed to load meme');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memeId]);

  return { meme, loading, error };
}

// Hook for real-time memes list
export function useRealTimeMemes(
  limitCount: number = 20,
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc'
) {
  const [memes, setMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const memesQuery = query(
      collection(db, 'memes'),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      memesQuery,
      (snapshot) => {
        const memesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MemeData));
        
        setMemes(memesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to memes updates:', error);
        setError('Failed to load memes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitCount, orderByField, orderDirection]);

  return { memes, loading, error };
}

// Hook for real-time user's followed memes
export function useRealTimeFollowedMemes(
  userId: string | null,
  followedUserIds: string[],
  limitCount: number = 20
) {
  const [memes, setMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || followedUserIds.length === 0) {
      setMemes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Firestore 'in' queries are limited to 10 items, so we need to batch
    const batches = [];
    for (let i = 0; i < followedUserIds.length; i += 10) {
      batches.push(followedUserIds.slice(i, i + 10));
    }

    const unsubscribes: Unsubscribe[] = [];
    const allMemes: MemeData[] = [];

    const processResults = () => {
      // Sort all memes by creation date
      const sortedMemes = allMemes
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limitCount);
      
      setMemes(sortedMemes);
      setLoading(false);
    };

    let completedBatches = 0;

    batches.forEach((batch, batchIndex) => {
      const batchQuery = query(
        collection(db, 'memes'),
        where('authorId', 'in', batch),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        batchQuery,
        (snapshot) => {
          // Clear previous results for this batch
          const startIndex = batchIndex * limitCount;
          allMemes.splice(startIndex, limitCount);

          // Add new results
          const batchMemes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as MemeData));

          allMemes.splice(startIndex, 0, ...batchMemes);

          completedBatches++;
          if (completedBatches === batches.length) {
            processResults();
          }
        },
        (error) => {
          console.error('Error listening to followed memes:', error);
          setError('Failed to load followed memes');
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, followedUserIds, limitCount]);

  return { memes, loading, error };
}

// Hook for real-time user stats
export function useRealTimeUserStats(userId: string | null) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const userRef = doc(db, 'users', userId);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setStats(doc.data().stats || {});
        } else {
          setStats(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user stats:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { stats, loading };
}

// Hook for real-time follow stats
export function useRealTimeFollowStats(userId: string | null) {
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFollowStats({ followersCount: 0, followingCount: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);

    const followStatsRef = doc(db, 'followStats', userId);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      followStatsRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setFollowStats({
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0
          });
        } else {
          setFollowStats({ followersCount: 0, followingCount: 0 });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to follow stats:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { followStats, loading };
}

// Hook for real-time hashtag trending
export function useRealTimeTrendingHashtags(limitCount: number = 10) {
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const hashtagsQuery = query(
      collection(db, 'trendingHashtags'),
      orderBy('count', 'desc'),
      limit(limitCount)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      hashtagsQuery,
      (snapshot) => {
        const hashtagsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setHashtags(hashtagsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to trending hashtags:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitCount]);

  return { hashtags, loading };
}

// Hook for real-time user XP
export function useRealTimeUserXP(userId: string | null) {
  const [userXP, setUserXP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUserXP(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const xpRef = doc(db, 'userXP', userId);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      xpRef,
      (doc) => {
        if (doc.exists()) {
          setUserXP(doc.data());
        } else {
          setUserXP(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user XP:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { userXP, loading };
}
