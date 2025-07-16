"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatRoom, ChatService } from "@/lib/chatService";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import NewGroupModal from "../components/NewGroupModal";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

function ChatPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { refreshUnreadCount } = useUnreadMessages();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Handle chatId from URL parameters (from notifications)
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId && user) {
      // Load the specific chat
      const loadSpecificChat = async () => {
        try {
          const chat = await ChatService.getChatRoom(chatId);
          if (chat && chat.participants.includes(user.uid)) {
            setSelectedChat(chat);
          }
        } catch (error) {
          console.error('Error loading specific chat:', error);
        }
      };
      loadSpecificChat();
    }
  }, [searchParams, user]);

  // Refresh unread count when a chat is selected (user is reading messages)
  useEffect(() => {
    if (selectedChat && user) {
      // Delay to allow messages to be marked as read
      const timer = setTimeout(() => {
        refreshUnreadCount();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [selectedChat, user, refreshUnreadCount]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleChatSelect = (chat: ChatRoom) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  const handleNewGroup = () => {
    setShowNewGroupModal(true);
  };

  const handleGroupCreated = (group: ChatRoom) => {
    // Select the newly created group immediately
    setSelectedChat(group);
    // The real-time listener in ChatSidebar will automatically update the sidebar
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${isMobile && selectedChat ? 'hidden' : 'block'}`}>
        <ChatSidebar
          selectedChatId={selectedChat?.id}
          onChatSelect={handleChatSelect}
          onNewGroup={handleNewGroup}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Select a chat</h3>
              <p className="text-text-secondary">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
