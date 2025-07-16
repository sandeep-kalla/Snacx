"use client";

import { motion } from "framer-motion";
import { AdminRole } from "../../types/admin";

interface AdminBadgeProps {
  role: AdminRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AdminBadge({ role, size = 'sm', className = "" }: AdminBadgeProps) {
  const roleConfig = {
    super_admin: {
      label: 'Super Admin',
      icon: '👑',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-white'
    },
    moderator: {
      label: 'Moderator',
      icon: '🛡️',
      color: 'bg-gradient-to-r from-blue-500 to-purple-500',
      textColor: 'text-white'
    },
    content_admin: {
      label: 'Content Admin',
      icon: '⚡',
      color: 'bg-gradient-to-r from-green-500 to-teal-500',
      textColor: 'text-white'
    }
  };

  const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const config = roleConfig[role];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center space-x-1 rounded-full font-bold shadow-lg ${config.color} ${config.textColor} ${sizeConfig[size]} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </motion.div>
  );
}
