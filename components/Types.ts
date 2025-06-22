// Define all shared types for the Lumeroo application

/**
 * Comment type representing a user comment on a video
 */
export interface CommentType {
  id: number;
  username: string;
  avatar: string;
  content: string;
  likes: number;
  timeAgo: string;
  replies?: CommentType[];
}

/**
 * Uploader type representing the user who uploaded content
 */
export interface UploaderType {
  _id: string;
  username: string;
  avatar?: string;
  avatarColor?: string;
  subscriberCount?: number;
}

/**
 * Video type representing a video in the system
 */
export interface VideoType {
  id: string | number; // Allow both string and number for compatibility
  _id?: string; // MongoDB ObjectId
  slug?: string; // Add slug field for SEO-friendly URLs
  title: string;
  thumbnail?: string;
  imageUrls?: string[]; // Array of image URLs for image posts
  thumbnailIndex?: number; // Index of the thumbnail image in imageUrls array
  duration: string;
  views: number;
  uploader: string | UploaderType; // Support both string and object formats
  videoUrl?: string;
  uploadDate?: string;
  description?: string;
  subscriberCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  comments?: CommentType[];
  tags?: string[];
}

/**
 * User type representing a registered user
 */
export interface UserType {
  id: number;
  username: string;
  avatar: string;
  subscriberCount: number;
  isVerified: boolean;
  joinDate: string;
}

/**
 * Category type for navigation and video filtering
 */
export interface CategoryType {
  id: number;
  name: string;
  icon: React.ReactNode;
}

/**
 * Notification type for user notifications
 */
export interface NotificationType {
  id: number;
  type: 'like' | 'comment' | 'subscribe' | 'mention';
  fromUser: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  videoId?: number;
}