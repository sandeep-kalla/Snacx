export interface Follow {
  id: string;
  followerId: string; // User who is following
  followingId: string; // User being followed
  createdAt: number;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface UserInteraction {
  id: string;
  userId: string;
  targetId: string; // meme ID or user ID
  type: 'like' | 'bookmark' | 'follow';
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface NotificationData {
  id: string;
  userId: string; // Recipient of the notification
  fromUserId: string; // User who triggered the notification
  type: 'like' | 'comment' | 'follow' | 'achievement' | 'reply' | 'mention' | 'chat_message' | 'group_added' | 'group_admin' | 'group_removed';
  targetId?: string; // meme ID, comment ID, etc.
  message: string;
  read: boolean;
  createdAt: number;
  metadata?: {
    memeTitle?: string;
    achievementName?: string;
    commentText?: string;
    [key: string]: any;
  };
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  parentCommentId: string;
  memeId: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  memeId: string;
  replies?: CommentReply[];
  replyCount?: number;
}

export interface MonthlyTopPerformer {
  userId: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
  month: number;
  year: number;
}

export interface TopPerformersData {
  month: number;
  year: number;
  performers: MonthlyTopPerformer[];
  generatedAt: number;
}
