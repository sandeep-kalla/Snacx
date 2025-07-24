import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, userId } = await request.json();

    if (!userId || !action || (action !== 'like' && action !== 'unlike')) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const memeRef = doc(db, 'memes', id);
    
    // Check if meme exists
    const memeDoc = await getDoc(memeRef);
    if (!memeDoc.exists()) {
      return NextResponse.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }

    // Update likes array
    if (action === 'like') {
      await updateDoc(memeRef, {
        likes: arrayUnion(userId)
      });
    } else {
      await updateDoc(memeRef, {
        likes: arrayRemove(userId)
      });
    }

    // Get updated meme data
    const updatedMeme = await getDoc(memeRef);
    const memeData = updatedMeme.data();
    
    const response = NextResponse.json({
      success: true,
      isLiked: action === 'like',
      likesCount: memeData?.likes?.length || 0,
      message: action === 'like' ? 'Liked successfully' : 'Unliked successfully'
    });

    // Short cache since like status can change frequently
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error updating like:', error);
    return NextResponse.json(
      { error: 'Failed to update like status' },
      { status: 500 }
    );
  }
}
