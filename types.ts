export interface User {
  id: number;
  username: string;
  passwordHash: string;
  likedVideoIds: number[];
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  isBanned: boolean;
  tier: 'Normal' | 'Vip' | 'SVip';
  // VIP+ Features
  profileBannerUrl?: string;
  pinnedVideoId?: number;
  watchHistory?: number[];
  preferences?: {
    trackHistory: boolean;
  };
  commentStyle?: {
    color?: string; // VIP
    gradient?: { from: string, to: string }; // SVIP
  };
}

export interface Comment {
  id: number;
  videoId: number;
  userId: number;
  username: string; // Keep for fallback
  displayName: string;
  avatarUrl: string;
  isUserVerified: boolean;
  text: string;
  timestamp: string;
  status: 'approved' | 'pending_moderation';
  moderationReason?: string | null;
  isPinned?: boolean; // For SVIPs on their own videos
}

export interface Video {
  id: number;
  title: string;
  type: 'video' | 'link' | 'image';
  videoUrl?: string; // Will be a blob: URL for uploaded videos
  imageUrl?: string; // Will be a blob: URL for uploaded images
  filePath?: string; // "server" path e.g. /uploads/video.mp4
  thumbnailUrl: string | null; // Can be a blob: URL or external
  externalUrl?: string;
  likes: number;
  dislikes: number;
  views: number;
  uploadDate: string;
  status: 'approved' | 'pending';
  uploaderId: number;
  uploaderName: string;
  uploaderAvatarUrl?: string;
  isUploaderVerified: boolean;
  tier: 'Normal' | 'Vip' | 'SVip';
  password?: string;
  comments: Comment[];
  // AI features
  moderationStatus?: 'flagged' | null;
  moderationReason?: string | null;
  classification?: string | null;
  aiKeywords?: string[];
  aiSceneTags?: { timestamp: number; description: string; }[];
  analytics?: {
      viewsByDate: Record<string, number>; // "YYYY-MM-DD": count
  };
}

export interface UploadPayload {
  title: string;
  videoFile: File | null;
  thumbnailFile: File | null;
  type: 'video' | 'link' | 'image';
  externalUrl: string;
  tier: 'Normal' | 'Vip' | 'SVip';
  password?: string;
}
