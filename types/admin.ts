export interface AdminUser {
  uid: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: number;
  lastLogin: number;
  isActive: boolean;
}

export type AdminRole = 'super_admin' | 'moderator' | 'content_admin';

export type AdminPermission =
  | 'delete_any_post'
  | 'delete_any_comment'
  | 'ban_user'
  | 'manage_admins'
  | 'view_analytics'
  | 'moderate_content'
  | 'DELETE_USER';

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'delete_any_post',
    'delete_any_comment',
    'ban_user',
    'manage_admins',
    'view_analytics',
    'moderate_content',
    'DELETE_USER'
  ],
  moderator: [
    'delete_any_post',
    'delete_any_comment',
    'moderate_content'
  ],
  content_admin: [
    'delete_any_post',
    'delete_any_comment',
    'moderate_content'
  ]
};

export const ADMIN_EMAILS = [
  'admin@memeapp.com',
  'moderator@memeapp.com',
  'gargakshay0805@gmail.com', // Super Admin
  // Add more admin emails here
];

export interface AdminAction {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AdminActionType;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  targetUserId: string;
  reason?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export type AdminActionType =
  | 'delete_post'
  | 'delete_comment'
  | 'ban_user'
  | 'unban_user'
  | 'warn_user'
  | 'DELETE_USER';

export interface AdminStats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  postsToday: number;
  commentsToday: number;
  newUsersToday: number;
  recentActions: AdminAction[];
}
