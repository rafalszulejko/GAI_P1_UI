import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, X } from 'lucide-react'
import { Message, Chat, ChatType } from '@/types/chat'
import { User } from '@/types/user'
import { getMessagesByChat, sendMessage } from '@/services/messageService'
import { getChatById, ChatServiceError, updateChat } from '@/services/chatService'
import { getUserById } from '@/services/userService'
import { useAuth } from '@/components/providers/auth-provider'
import { SSEService, ChatEvent } from '@/services/sseService'
import ChatMessage from './ChatMessage'

interface ChatAreaProps {
  chatId: string
  mode?: ChatType
  parentMessage?: Message
  onChatUpdated?: (chat: Chat) => void
  onThreadClick?: (threadId: string, parentMessage: Message) => void
  onClose?: () => void
}

export default function ChatArea({ 
  chatId, 
  mode = ChatType.CHANNEL, 
  parentMessage,
  onChatUpdated,
  onThreadClick,
  onClose 
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chat, setChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadParentMessage, setThreadParentMessage] = useState<Message | null>(null)
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const { getToken } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const sseService = useRef(new SSEService())
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (!mounted) return
      
      setIsLoading(true)
      setError(null)

      try {
        const [chatData, messagesData, initialOnlineUsers] = await Promise.all([
          getChatById(chatId),
          getMessagesByChat(chatId),
          sseService.current.getOnlineUsers()
        ])

        // Get unique sender IDs from messages
        const senderIds = new Set(messagesData.map(message => message.senderId))
        
        // Fetch user data for each unique sender
        const userPromises = Array.from(senderIds).map(async (senderId) => {
          try {
            const user = await getUserById(senderId)
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
          setOnlineUsers(initialOnlineUsers)

          // Subscribe to SSE events
          await sseService.current.subscribeToChatUpdates(chatId, (event: ChatEvent) => {
            console.log('Processing event in ChatArea:', event); // Debug log
            switch (event.type) {
              case 'NEW_MESSAGE':
                setMessages(prev => [...prev, event.data]);
                // Fetch user data if we don't have it
                if (!users.has(event.data.senderId)) {
                  getUserById(event.data.senderId)
                    .then(user => setUsers(prev => new Map(prev).set(event.data.senderId, user)))
                    .catch(console.error);
                }
                break;
              case 'ONLINE_USERS':
              case 'PRESENCE_UPDATE':
                setOnlineUsers(event.data);
                break;
            }
          });
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

    return () => { 
      mounted = false
      sseService.current.cleanup()
    }
  }, [chatId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId) return

    try {
      const message = await sendMessage(chatId, newMessage.trim())
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      setError('Failed to send message')
    }
  }

  const handleReplyClick = (message: Message) => {
    if (onThreadClick) {
      onThreadClick(message.threadId || '', message)
    }
  }

  const handleStartEdit = () => {
    setEditedName(chat?.name ?? '')
    setEditedDescription(chat?.description ?? '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!chat) return

    try {
      const updatedChat = await updateChat(chat.id, {
        id: chat.id,
        name: editedName,
        description: editedDescription
      })

      setChat(updatedChat)
      setIsEditing(false)
      if (onChatUpdated) {
        onChatUpdated(updatedChat)
      }
    } catch (error) {
      setError('Failed to update chat')
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

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Select a chat to start messaging</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          {isEditing ? (
            <div className="space-y-2 flex-1">
              <div className="flex gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="font-semibold"
                />
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
              <Input
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="text-sm text-gray-500"
              />
            </div>
          ) : (
            <div className="cursor-pointer flex-1" onClick={handleStartEdit}>
              <h2 className="font-semibold">{chat.name}</h2>
              {chat.description && (
                <p className="text-sm text-gray-500">{chat.description}</p>
              )}
            </div>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {mode === ChatType.THREAD && parentMessage && (
          <ChatMessage
            message={parentMessage}
            user={users.get(parentMessage.senderId)}
            isOnline={onlineUsers.includes(parentMessage.senderId)}
            isReplyAllowed={false}
            isThreadMessage={true}
            className="mt-4 bg-muted/50"
          />
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              user={users.get(message.senderId)}
              isOnline={onlineUsers.includes(message.senderId)}
              isReplyAllowed={mode !== ChatType.THREAD}
              isThreadMessage={mode === ChatType.THREAD}
              onReplyClick={handleReplyClick}
              onThreadClick={handleReplyClick}
            />
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={mode === ChatType.THREAD ? "Reply in thread..." : "Type a message..."}
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

