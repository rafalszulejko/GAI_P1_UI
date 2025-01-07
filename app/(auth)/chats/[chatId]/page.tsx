'use client'

import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { Chat } from '@/types/chat'
import { getChatById } from '@/services/chatService'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const router = useRouter()
  const [chat, setChat] = useState<Chat | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const loadChat = async () => {
      if (!isAuthenticated || isLoading) return

      try {
        const token = await getAccessTokenSilently()
        const chatData = await getChatById(params.chatId, token)
        setChat(chatData)
      } catch (error) {
        console.error('Error loading chat:', error)
        router.push('/')
      }
    }

    loadChat()
  }, [isAuthenticated, isLoading, params.chatId, getAccessTokenSilently, router])

  if (isLoading || !chat) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        mode="chat"
        currentChannel={chat.name}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen}
          currentChat={chat.id}
          mode="chat"
        />
        <ChatArea chatName={chat.name} />
      </div>
    </div>
  )
} 