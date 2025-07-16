"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { AdminService } from "@/lib/adminService";
import { AdminUser, AdminPermission } from "../../types/admin";

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAdminStatus = async () => {
    if (!user) {
      setAdminUser(null);
      return;
    }

    setIsLoading(true);
    try {
      // Check if user email is in admin list
      const isAdminEmail = await AdminService.isUserAdmin(user.email || '');
      
      if (isAdminEmail) {
        // Get existing admin user or create new one
        let admin = await AdminService.getAdminUser(user.uid);
        
        if (!admin) {
          // Create admin user if doesn't exist
          admin = await AdminService.createAdminUser(
            user.uid, 
            user.email || '', 
            'moderator' // Default role
          );
        }
        
        if (admin) {
          // Update last login
          await AdminService.updateAdminLogin(user.uid);
          setAdminUser(admin);
        }
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!adminUser) return false;
    return AdminService.hasPermission(adminUser, permission);
  };

  const refreshAdminStatus = async () => {
    await checkAdminStatus();
  };

  const value = {
    adminUser,
    isAdmin: !!adminUser,
    isLoading,
    hasPermission,
    refreshAdminStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
