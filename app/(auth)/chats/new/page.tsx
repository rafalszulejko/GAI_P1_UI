'use client'

import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { createChat } from '@/services/chatService'
import { Chat } from '@/types/chat'

export default function NewChatPage() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const router = useRouter()
  const [chatName, setChatName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatName.trim() || isCreating) return

    setIsCreating(true)
    try {
      const token = await getAccessTokenSilently()
      const newChat: Chat = {
        id: '', // will be set by the server
        name: chatName.trim(),
        createdAt: new Date().toISOString(),
        messages: []
      }
      
      const createdChat = await createChat(newChat, token)
      router.push(`/chats/${createdChat.id}`)
    } catch (error) {
      console.error('Error creating chat:', error)
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold">Create a New Chat</h2>
          <p className="mt-2 text-center text-gray-600">
            Get started by creating your first chat
          </p>
        </div>
        <form onSubmit={handleCreateChat} className="mt-8 space-y-6">
          <div>
            <label htmlFor="chatName" className="block text-sm font-medium text-gray-700">
              Chat Name
            </label>
            <input
              id="chatName"
              type="text"
              required
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter chat name"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !chatName.trim()}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Chat'}
          </button>
        </form>
      </div>
    </div>
  )
} 