import { NextRequest, NextResponse } from 'next/server';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Meme } from '@/types/meme';

// Enable static generation with revalidation
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

interface MemeWithServerData extends Meme {
  _serverFetchedAt: number;
  hashtags?: string[]; // Add hashtags property
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageSize = parseInt(searchParams.get('limit') || '20');
  const lastMemeId = searchParams.get('cursor');
  const hashtags = searchParams.get('hashtags')?.split(',').filter(Boolean) || [];

  try {
    let q = query(
      collection(db, 'memes'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Add cursor-based pagination
    if (lastMemeId) {
      const lastDoc = await getDocs(query(collection(db, 'memes'), orderBy('createdAt', 'desc')));
      const lastDocSnapshot = lastDoc.docs.find(doc => doc.id === lastMemeId);
      if (lastDocSnapshot) {
        q = query(
          collection(db, 'memes'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDocSnapshot),
          limit(pageSize)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const memes: MemeWithServerData[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _serverFetchedAt: Date.now()
    } as MemeWithServerData));

    // Filter by hashtags if provided (server-side filtering)
    let filteredMemes = memes;
    if (hashtags.length > 0) {
      filteredMemes = memes.filter(meme => {
        const memeHashtags = meme.hashtags || [];
        return hashtags.every(tag => memeHashtags.includes(tag));
      });
    }

    // Set cache headers for better performance
    const response = NextResponse.json({
      memes: filteredMemes,
      hasMore: querySnapshot.docs.length === pageSize,
      cursor: querySnapshot.docs[querySnapshot.docs.length - 1]?.id || null
    });

    // Cache for 1 minute, allow stale responses for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching memes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memes' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating memes with server-side validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Server-side validation
    if (!body.title || !body.publicId || !body.authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // You can add the meme creation logic here
    // For now, return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating meme:', error);
    return NextResponse.json(
      { error: 'Failed to create meme' },
      { status: 500 }
    );
  }
}
