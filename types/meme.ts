export interface Meme {
  id: string;
  imageUrl: string;
  publicId: string;
  title: string;
  authorId: string;
  authorName: string;
  likes: string[];
  comments: Array<{
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
  }>;
  createdAt: number;
}

export interface MemeComment {
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}
