import { NextRequest, NextResponse } from 'next/server';
import { FollowService } from '@/lib/followService';

export async function POST(request: NextRequest) {
  try {
    const { followerId, followingId, action } = await request.json();

    if (!followerId || !followingId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'follow') {
      result = await FollowService.followUser(followerId, followingId);
    } else if (action === 'unfollow') {
      result = await FollowService.unfollowUser(followerId, followingId);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "follow" or "unfollow"' },
        { status: 400 }
      );
    }

    // Get updated follow status and stats
    const [isFollowing, stats] = await Promise.all([
      FollowService.isFollowing(followerId, followingId),
      FollowService.getFollowStats(followingId)
    ]);

    const response = NextResponse.json({
      success: result,
      isFollowing,
      followersCount: stats.followersCount,
      message: action === 'follow' ? 'Following successfully' : 'Unfollowed successfully'
    });

    // Short cache since follow status can change frequently
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error in follow operation:', error);
    return NextResponse.json(
      { error: 'Failed to update follow status' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const followerId = searchParams.get('followerId');
    const followingId = searchParams.get('followingId');

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'Missing followerId or followingId' },
        { status: 400 }
      );
    }

    const [isFollowing, stats] = await Promise.all([
      FollowService.isFollowing(followerId, followingId),
      FollowService.getFollowStats(followingId)
    ]);

    const response = NextResponse.json({
      isFollowing,
      followersCount: stats.followersCount,
      followingCount: stats.followingCount
    });

    // Cache follow status for 30 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
