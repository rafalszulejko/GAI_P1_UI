import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2 } from 'lucide-react'
import { Message, Chat } from '@/types/chat'
import { User } from '@/types/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMessagesByChat, sendMessage } from '@/services/messageService'
import { getChatById, ChatServiceError } from '@/services/chatService'
import { getUserByUsername } from '@/services/userService'
import { useAuth } from '@/components/providers/auth-provider'
import ThreadArea from './ThreadArea'

interface ChatAreaProps {
  chatId: string
}

export default function ChatArea({ chatId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chat, setChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadParentMessage, setThreadParentMessage] = useState<Message | null>(null)
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const { getToken } = useAuth()

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (!mounted) return
      
      setIsLoading(true)
      setError(null)

      try {
        const token = await getToken()
        if (!token) {
          throw new ChatServiceError('No authentication token available')
        }

        const [chatData, messagesData] = await Promise.all([
          getChatById(chatId, token),
          getMessagesByChat(chatId, token)
        ])

        // Get unique sender IDs from messages
        const senderIds = new Set(messagesData.map(message => message.senderId))
        
        // Fetch user data for each unique sender
        const userPromises = Array.from(senderIds).map(async (senderId) => {
          try {
            const user = await getUserByUsername(senderId)
            return [senderId, user] as [string, User]
          } catch (error) {
            console.error(`Failed to fetch user data for ${senderId}:`, error)
            return null
          }
        })

        const userEntries = (await Promise.all(userPromises))
          .filter((entry): entry is [string, User] => entry !== null)
        
        if (mounted) {
          setChat(chatData)
          setMessages(messagesData)
          setUsers(new Map(userEntries))
        }
      } catch (error) {
        if (mounted) {
          const message = error instanceof ChatServiceError 
            ? error.message 
            : 'Failed to load chat'
          setError(message)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    if (chatId) {
      fetchData()
    }

    return () => { mounted = false }
  }, [chatId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId) return

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const message = await sendMessage(chatId, newMessage.trim(), token)
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      setError('Failed to send message')
    }
  }

  const handleThreadClick = (threadId: string, message: Message) => {
    setActiveThreadId(threadId)
    setThreadParentMessage(message)
  }

  const handleReplyClick = (message: Message) => {
    setThreadParentMessage(message)
    setActiveThreadId(message.threadId || '')
  }

  const handleCloseThread = () => {
    setActiveThreadId(null)
    setThreadParentMessage(null)
  }

  const handleParentMessageUpdate = (updatedMessage: Message) => {
    setMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ))
    setThreadParentMessage(updatedMessage)
    setActiveThreadId(updatedMessage.threadId)
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Select a chat to start messaging</div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1">
        <div className="border-b p-4">
          <h2 className="font-semibold">{chat.name}</h2>
          {chat.description && (
            <p className="text-sm text-gray-500">{chat.description}</p>
          )}
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const user = users.get(message.senderId)
              return (
                <div 
                  key={message.id} 
                  className="flex items-start gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group"
                >
                  <Avatar>
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                    <AvatarFallback>{user?.username?.[0] ?? message.senderId[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user?.username ?? message.senderId}</div>
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(message.sentAt).toLocaleString()}
                    </div>
                    {message.threadId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-gray-500"
                        onClick={() => handleThreadClick(message.threadId!, message)}
                      >
                        Thread
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => handleReplyClick(message)}
                  >
                    Reply
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {threadParentMessage && (
        <div className="w-96 border-l bg-background">
          <ThreadArea 
            threadId={activeThreadId}
            parentMessage={threadParentMessage}
            onClose={handleCloseThread}
            onParentUpdate={handleParentMessageUpdate}
          />
        </div>
      )}
    </div>
  )
}

