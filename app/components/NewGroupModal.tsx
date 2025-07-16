"use client";

import { useState, useEffect } from "react";
import { ChatService, ChatRoom } from "@/lib/chatService";
import { FollowService } from "@/lib/followService";
import { UserService, UserProfile } from "@/lib/userService";
import { InteractionSortingService } from "@/lib/interactionSortingService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { getAvatarById } from "../../types/user";
import AvatarSelector from "./AvatarSelector";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (group: ChatRoom) => void;
}

export default function NewGroupModal({ isOpen, onClose, onGroupCreated }: NewGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState('👥');
  const [customGroupAvatarUrl, setCustomGroupAvatarUrl] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadFollowedUsers();
    }
  }, [isOpen, user]);

  const loadFollowedUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const users = await FollowService.getFollowing(user.uid);
      
      // Get user profiles
      const profiles = await Promise.all(
        users.map(follow => UserService.getUserProfile(follow.followingId))
      );
      
      const validProfiles = profiles.filter(profile => profile !== null) as UserProfile[];
      
      // Sort by interaction level
      const sortedUsers = await InteractionSortingService.sortUsersByInteraction(
        user.uid, 
        validProfiles
      );
      
      setFollowedUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading followed users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleGroupAvatarSelect = (avatarId: string, customUrl?: string) => {
    if (customUrl) {
      setCustomGroupAvatarUrl(customUrl);
      setGroupAvatar("custom");
    } else {
      setGroupAvatar(avatarId);
      setCustomGroupAvatarUrl("");
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) {
      toast.error('Please enter a group name and select at least one user');
      return;
    }

    try {
      setCreating(true);

      // Use custom URL if available, otherwise use selected avatar ID
      const avatarToUse = customGroupAvatarUrl || groupAvatar;

      // Create the group chat with avatar
      const newGroup = await ChatService.createGroupChat(user.uid, selectedUsers, groupName.trim(), undefined, avatarToUse);

      toast.success('Group created successfully!');

      // Reset form
      setGroupName('');
      setSelectedUsers([]);
      setGroupAvatar('👥');
      setCustomGroupAvatarUrl('');

      // Close modal and pass the new group
      onClose();
      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }
      
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    setGroupAvatar('👥');
    setCustomGroupAvatarUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">New Group</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Group Name */}
          <div>
            <label className="block text-lg font-medium text-foreground mb-3">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full p-4 bg-background border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-lg"
              maxLength={50}
            />
          </div>

          {/* Group Avatar */}
          <div>
            <label className="block text-lg font-medium text-foreground mb-3">
              Group Avatar
            </label>
            <AvatarSelector
              selectedAvatarId={groupAvatar}
              onAvatarSelect={handleGroupAvatarSelect}
              className="w-full"
            />
          </div>

          {/* Add Users */}
          <div>
            <label className="block text-lg font-medium text-foreground mb-3">
              Add Users
            </label>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : followedUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {followedUsers.map((userProfile) => (
                  <div
                    key={userProfile.uid}
                    onClick={() => handleUserSelect(userProfile.uid)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                      selectedUsers.includes(userProfile.uid)
                        ? 'bg-primary/20 border-primary shadow-md scale-105'
                        : 'bg-card border-border hover:border-primary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {userProfile.avatar.startsWith('http') ? (
                          <img
                            src={userProfile.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {getAvatarById(userProfile.avatar)?.url || '🐱'}
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-foreground text-sm">{userProfile.nickname}</h4>
                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {userProfile.bio || 'No bio'}
                        </p>
                      </div>
                      {selectedUsers.includes(userProfile.uid) && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No followers found. Follow some users to create groups!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedUsers.length > 0 && (
                <span>{selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creating || !groupName.trim() || selectedUsers.length === 0}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
