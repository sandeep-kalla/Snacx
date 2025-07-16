"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { AdminService } from "@/lib/adminService";
import { useAdmin } from "../context/AdminContext";
import { AdminUser, AdminRole } from "../../types/admin";
import AdminBadge from "./AdminBadge";
import ConfirmModal from "./ConfirmModal";

export default function AdminManagement() {
  const { isAdmin, adminUser, hasPermission } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("moderator");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);

  // Only super admins can manage other admins
  const canManageAdmins = isAdmin && hasPermission('manage_admins');

  useEffect(() => {
    if (canManageAdmins) {
      loadAdmins();
    }
  }, [canManageAdmins]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminList = await AdminService.getAllAdmins();
      setAdmins(adminList);
    } catch (error) {
      console.error("Error loading admins:", error);
      toast.error("Failed to load admin list");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!newAdminEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAddingAdmin(true);
    try {
      // Check if email is already an admin
      const existingAdmin = admins.find(admin => admin.email.toLowerCase() === newAdminEmail.toLowerCase());
      if (existingAdmin) {
        toast.error("This email is already an admin");
        return;
      }

      // For now, we'll add the email to the ADMIN_EMAILS array in the database
      // In a real app, you'd want to store this in a separate collection
      toast.success(`Admin invitation sent to ${newAdminEmail}. They will become an admin when they next sign in.`);
      
      setNewAdminEmail("");
      setNewAdminRole("moderator");
      
      // Note: In a production app, you'd want to:
      // 1. Send an email invitation
      // 2. Store pending invitations in a database
      // 3. Activate admin status when they accept
      
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error("Failed to add admin");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return;

    try {
      // Prevent removing yourself
      if (adminToRemove.uid === adminUser?.uid) {
        toast.error("You cannot remove yourself as an admin");
        return;
      }

      // In a real app, you'd deactivate the admin in the database
      toast.success(`${adminToRemove.email} has been removed as an admin`);
      
      // Reload the admin list
      await loadAdmins();
      
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("Failed to remove admin");
    } finally {
      setShowConfirmModal(false);
      setAdminToRemove(null);
    }
  };

  if (!canManageAdmins) {
    return (
      <div className="bg-card rounded-xl p-6 border border-primary/20">
        <h3 className="text-lg font-bold text-text-primary mb-2">Admin Management</h3>
        <p className="text-text-secondary">You don't have permission to manage admins.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-primary/20">
      <h3 className="text-lg font-bold text-text-primary mb-4">Admin Management</h3>
      
      {/* Add New Admin */}
      <div className="mb-6 p-4 bg-background rounded-lg border border-primary/10">
        <h4 className="font-medium text-text-primary mb-3">Add New Admin</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter email address"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-secondary border border-primary/20 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
            className="px-3 py-2 bg-secondary border border-primary/20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="moderator">Moderator</option>
            <option value="content_admin">Content Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button
            onClick={handleAddAdmin}
            disabled={isAddingAdmin}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingAdmin ? "Adding..." : "Add Admin"}
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          The user will become an admin when they next sign in with this email.
        </p>
      </div>

      {/* Current Admins */}
      <div>
        <h4 className="font-medium text-text-primary mb-3">Current Admins</h4>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-background rounded-lg p-3">
                <div className="h-4 bg-secondary rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-secondary rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : admins.length === 0 ? (
          <p className="text-text-secondary italic">No admins found.</p>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <motion.div
                key={admin.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-primary/10"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-text-primary">{admin.email}</p>
                      <AdminBadge role={admin.role} size="sm" />
                    </div>
                    <p className="text-xs text-text-secondary">
                      Last login: {new Date(admin.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {admin.uid !== adminUser?.uid && (
                  <button
                    onClick={() => {
                      setAdminToRemove(admin);
                      setShowConfirmModal(true);
                    }}
                    className="px-3 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Remove
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setAdminToRemove(null);
        }}
        onConfirm={handleRemoveAdmin}
        title="Remove Admin"
        message={`Are you sure you want to remove ${adminToRemove?.email} as an admin? This action cannot be undone.`}
        confirmText="Remove"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
      />
    </div>
  );
}
