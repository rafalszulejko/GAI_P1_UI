import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2 } from 'lucide-react'
import { Message, Chat, ChatType } from '@/types/chat'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getMessagesByChat, sendMessage, updateMessage } from '@/services/messageService'
import { getChatById, createChat, ChatServiceError } from '@/services/chatService'
import { useAuth } from '@/components/providers/auth-provider'

interface ThreadAreaProps {
  threadId: string | null;
  parentMessage: Message;
  onClose: () => void;
  onParentUpdate?: (message: Message) => void;
}

export default function ThreadArea({ threadId, parentMessage, onClose, onParentUpdate }: ThreadAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getToken } = useAuth()

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (!threadId || threadId === '') {
        setMessages([])
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      setError(null)

      try {
        const messagesData = await getMessagesByChat(threadId)

        if (mounted) {
          setMessages(messagesData)
        }
      } catch (error) {
        if (mounted) {
          const message = error instanceof ChatServiceError 
            ? error.message 
            : 'Failed to load thread'
          setError(message)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [threadId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      // For new threads, create a thread chat first
      let actualThreadId = threadId
      if (threadId === '') {
        // Create a new thread chat
        const threadChat = await createChat({
          id: '', // Will be assigned by the server
          name: 'Thread',
          description: '',
          type: ChatType.THREAD,
          lastMessageAt: new Date()
        })
        
        actualThreadId = threadChat.id

        // Update the parent message with the new threadId
        const updatedParent = await updateMessage(parentMessage.id, {
          ...parentMessage,
          threadId: actualThreadId
        })

        // Notify parent component about the update
        if (onParentUpdate) {
          onParentUpdate(updatedParent)
        }
      }

      if (!actualThreadId) return

      // Send the new message
      const message = await sendMessage(actualThreadId, newMessage.trim())
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      setError('Failed to send message')
    }
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

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="font-semibold">Thread</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Avatar>
              <AvatarFallback>{parentMessage.senderId[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{parentMessage.senderId}</div>
              <div className="text-sm">{parentMessage.content}</div>
              <div className="text-xs text-gray-500">
                {new Date(parentMessage.sentAt).toLocaleString()}
              </div>
            </div>
          </div>

          {messages.map((message) => (
            <div 
              key={message.id} 
              className="flex items-start gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ml-4"
            >
              <Avatar>
                <AvatarFallback>{message.senderId[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{message.senderId}</div>
                <div className="text-sm">{message.content}</div>
                <div className="text-xs text-gray-500">
                  {new Date(message.sentAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
} 