'use client';

import { useState, useEffect } from 'react';
import { getUserChats } from '@/services/chatMemberService';
import { getChatById } from '@/services/chatService';
import { Chat, ChatMember, ChatType, Message } from '@/types/chat';
import ChatList from '@/components/ChatList';
import ChatArea from '@/components/ChatArea';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/providers/auth-provider';
import { useSidebar } from '@/components/ui/sidebar';

export default function ChatPage() {
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [activeThread, setActiveThread] = useState<{
    threadId: string;
    parentMessage: Message;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    let mounted = true;

    const fetchChats = async () => {
      if (!isAuthenticated || !mounted) return;
      
      try {
        setIsLoading(true);
        const members = await getUserChats();
        if (mounted) {
          setChatMembers(members);
          
          // Fetch all chat details in parallel
          const chatPromises = members.map(member => getChatById(member.chatId));
          const chatDetails = await Promise.all(chatPromises);
          
          setChats(chatDetails);
          // Only select first chat if we have chats and no selection
          if (chatDetails.length > 0 && !selectedChatId) {
            setSelectedChatId(chatDetails[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (!isAuthLoading) {
      fetchChats();
    }

    return () => { mounted = false; };
  }, [isAuthenticated, getToken, isAuthLoading]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    // Close thread when switching chats
    setActiveThread(null);
  };

  const handleAddChat = async (chat: Chat) => {
    setChats(prevChats => [...prevChats, chat]);
    setSelectedChatId(chat.id);
  };

  const handleChatUpdate = (updatedChat: Chat) => {
    setChats(prevChats => prevChats.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    ));
  };

  const handleThreadClick = (threadId: string, parentMessage: Message) => {
    setActiveThread({ threadId, parentMessage });
  };

  const handleParentMessageUpdate = (updatedMessage: Message) => {
    // Update the thread with the new threadId
    setActiveThread(prev => prev ? {
      ...prev,
      threadId: updatedMessage.threadId || '',
      parentMessage: updatedMessage
    } : null);
  };

  const handleCloseThread = () => {
    setActiveThread(null);
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="flex h-full w-full">
        {sidebarState === 'expanded' && (
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            isLoading={isLoading}
            onChatCreated={handleAddChat}
          />
        )}
        <div className={`flex-1 flex ${activeThread ? 'gap-0.5' : ''}`}>
          {selectedChatId ? (
            <>
              <div className={activeThread ? 'flex-1' : 'w-full'}>
                <ChatArea
                  chatId={selectedChatId}
                  mode={ChatType.CHANNEL}
                  onChatUpdated={handleChatUpdate}
                  onThreadClick={handleThreadClick}
                />
              </div>
              {activeThread && (
                <div className="w-96 border-l bg-background">
                  <ChatArea
                    chatId={activeThread.threadId}
                    mode={ChatType.THREAD}
                    parentMessage={activeThread.parentMessage}
                    onClose={handleCloseThread}
                    onParentUpdate={handleParentMessageUpdate}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Select a chat to get started</div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
} 