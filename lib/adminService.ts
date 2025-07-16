import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  addDoc,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AdminUser, 
  AdminRole, 
  AdminPermission, 
  AdminAction, 
  AdminActionType,
  ADMIN_ROLE_PERMISSIONS,
  ADMIN_EMAILS 
} from '../types/admin';

export class AdminService {
  private static readonly ADMIN_COLLECTION = 'adminUsers';
  private static readonly ADMIN_ACTIONS_COLLECTION = 'adminActions';

  // Check if user is admin by email
  static async isUserAdmin(email: string): Promise<boolean> {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }

  // Get admin user data
  static async getAdminUser(uid: string): Promise<AdminUser | null> {
    try {
      const docRef = doc(db, this.ADMIN_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AdminUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  }

  // Create admin user
  static async createAdminUser(
    uid: string,
    email: string,
    role?: AdminRole
  ): Promise<AdminUser | null> {
    try {
      if (!await this.isUserAdmin(email)) {
        throw new Error('Email not authorized for admin access');
      }

      // Set role based on email - make gargakshay0805@gmail.com super admin
      let adminRole: AdminRole = role || 'moderator';
      if (email.toLowerCase() === 'gargakshay0805@gmail.com') {
        adminRole = 'super_admin';
      }

      const adminUser: AdminUser = {
        uid,
        email: email.toLowerCase(),
        role: adminRole,
        permissions: ADMIN_ROLE_PERMISSIONS[adminRole],
        createdAt: Date.now(),
        lastLogin: Date.now(),
        isActive: true
      };

      await setDoc(doc(db, this.ADMIN_COLLECTION, uid), adminUser);
      return adminUser;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return null;
    }
  }

  // Update admin last login
  static async updateAdminLogin(uid: string): Promise<void> {
    try {
      const docRef = doc(db, this.ADMIN_COLLECTION, uid);
      await updateDoc(docRef, {
        lastLogin: Date.now()
      });
    } catch (error) {
      console.error('Error updating admin login:', error);
    }
  }

  // Check if admin has permission
  static hasPermission(adminUser: AdminUser, permission: AdminPermission): boolean {
    return adminUser.permissions.includes(permission);
  }

  // Log admin action
  static async logAdminAction(
    adminId: string,
    adminEmail: string,
    action: AdminActionType,
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    targetUserId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const adminAction: Omit<AdminAction, 'id'> = {
        adminId,
        adminEmail,
        action,
        targetType,
        targetId,
        targetUserId,
        reason,
        timestamp: Date.now(),
        metadata
      };

      await addDoc(collection(db, this.ADMIN_ACTIONS_COLLECTION), adminAction);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  // Delete post (admin)
  static async deletePost(
    adminUser: AdminUser,
    postId: string,
    authorId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      if (!this.hasPermission(adminUser, 'delete_any_post')) {
        throw new Error('Insufficient permissions');
      }

      // Delete the post
      await deleteDoc(doc(db, 'memes', postId));

      // Log the action
      await this.logAdminAction(
        adminUser.uid,
        adminUser.email,
        'delete_post',
        'post',
        postId,
        authorId,
        reason
      );

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Delete comment (admin)
  static async deleteComment(
    adminUser: AdminUser,
    postId: string,
    commentIndex: number,
    commentUserId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      if (!this.hasPermission(adminUser, 'delete_any_comment')) {
        throw new Error('Insufficient permissions');
      }

      // Get the post
      const postRef = doc(db, 'memes', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        throw new Error('Post not found');
      }

      const postData = postSnap.data();
      const comments = postData.comments || [];
      
      if (commentIndex < 0 || commentIndex >= comments.length) {
        throw new Error('Comment not found');
      }

      // Remove the comment
      comments.splice(commentIndex, 1);
      
      // Update the post
      await updateDoc(postRef, { comments });

      // Log the action
      await this.logAdminAction(
        adminUser.uid,
        adminUser.email,
        'delete_comment',
        'comment',
        `${postId}_${commentIndex}`,
        commentUserId,
        reason
      );

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Get recent admin actions
  static async getRecentActions(limitCount: number = 50): Promise<AdminAction[]> {
    try {
      const q = query(
        collection(db, this.ADMIN_ACTIONS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const actions: AdminAction[] = [];
      
      querySnapshot.forEach((doc) => {
        actions.push({ id: doc.id, ...doc.data() } as AdminAction);
      });
      
      return actions;
    } catch (error) {
      console.error('Error getting recent actions:', error);
      return [];
    }
  }

  // Get all admin users
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.ADMIN_COLLECTION));
      const admins: AdminUser[] = [];
      
      querySnapshot.forEach((doc) => {
        admins.push(doc.data() as AdminUser);
      });
      
      return admins;
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  }

  // Delete user account (super admin only)
  static async deleteUserAccount(
    adminUserId: string,
    targetUserId: string,
    reason: string
  ): Promise<void> {
    try {
      // Check if admin has permission
      const hasPermission = await this.hasPermission(adminUserId, 'DELETE_USER');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to delete user accounts');
      }

      // Get admin user to check if super admin
      const adminUser = await this.getAdminUser(adminUserId);
      if (!adminUser || adminUser.role !== 'super_admin') {
        throw new Error('Only super admins can delete user accounts');
      }

      // Delete user's data
      const { UserService } = await import('./userService');
      const { MemeService } = await import('./memeService');
      const { FollowService } = await import('./followService');

      // Get user's memes and delete them
      const userMemes = await MemeService.getUserMemes(targetUserId);
      for (const meme of userMemes) {
        await MemeService.deleteMeme(meme.id, targetUserId);
      }

      // Delete user's follows/followers
      await FollowService.deleteAllUserFollows(targetUserId);

      // Delete user profile
      await deleteDoc(doc(db, 'users', targetUserId));

      // Log admin action
      await this.logAdminAction(adminUserId, 'DELETE_USER', targetUserId, {
        reason,
        deletedAt: Date.now()
      });

    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
}
