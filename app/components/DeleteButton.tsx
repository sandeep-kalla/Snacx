"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";

interface DeleteButtonProps {
  onDelete: () => Promise<boolean>;
  itemType: 'post' | 'comment';
  isOwner?: boolean;
  isAdmin?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function DeleteButton({
  onDelete,
  itemType,
  isOwner = false,
  isAdmin = false,
  size = 'sm',
  className = ""
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await onDelete();
      if (success) {
        toast.success(`${itemType === 'post' ? 'Post' : 'Comment'} deleted successfully`);
        setShowConfirm(false);
      } else {
        toast.error(`Failed to delete ${itemType}`);
      }
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      toast.error(`Failed to delete ${itemType}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const sizeConfig = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  };

  const getButtonColor = () => {
    if (isAdmin) return 'text-red-500 hover:text-red-600 hover:bg-red-50';
    if (isOwner) return 'text-gray-500 hover:text-red-500 hover:bg-red-50';
    return 'text-gray-400';
  };

  const getTooltip = () => {
    if (isAdmin) return `Delete ${itemType} (Admin)`;
    if (isOwner) return `Delete your ${itemType}`;
    return '';
  };

  if (!isOwner && !isAdmin) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className={`${sizeConfig[size]} rounded-full flex items-center justify-center transition-all duration-200 ${getButtonColor()} ${className}`}
        title={getTooltip()}
      >
        {isDeleting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 border border-current border-t-transparent rounded-full"
          />
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </motion.button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete ${itemType === 'post' ? 'Post' : 'Comment'}`}
        message={`Are you sure you want to delete this ${itemType}? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-500 hover:bg-red-600 text-white"
        isLoading={isDeleting}
      />
    </>
  );
}
