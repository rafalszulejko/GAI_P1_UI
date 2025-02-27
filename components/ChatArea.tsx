import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, X } from 'lucide-react'
import { Message, Chat, ChatType, CreateChatCommand } from '@/types/chat'
import { User } from '@/types/user'
import { getMessagesByChat, sendMessage, updateMessage } from '@/services/messageService'
import { getChatById, ChatServiceError, updateChat, createChat } from '@/services/chatService'
import { useAuth } from '@/components/providers/auth-provider'
import { SSEService, ChatEvent } from '@/services/sseService'
import ChatMessage from './ChatMessage'
import { Page } from '@/types/pagination'

interface ChatAreaProps {
  chatId: string
  mode?: ChatType
  parentMessage?: Message
  onChatUpdated?: (chat: Chat) => void
  onThreadClick?: (threadId: string, parentMessage: Message) => void
  onClose?: () => void
  onParentUpdate?: (updatedMessage: Message) => void
}

export default function ChatArea({ 
  chatId, 
  mode = ChatType.CHANNEL, 
  parentMessage,
  onChatUpdated,
  onThreadClick,
  onClose,
  onParentUpdate
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [messagePage, setMessagePage] = useState<Page<Message> | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [chat, setChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadParentMessage, setThreadParentMessage] = useState<Message | null>(null)
  const { isAuthenticated } = useAuth()
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
      
      console.log('ChatArea: Starting data fetch, authenticated:', isAuthenticated)
      setIsLoading(true)
      setError(null)

      try {
        // For new threads (empty chatId), skip fetching chat and messages
        if (mode === ChatType.THREAD && chatId === '') {
          setChat(null)
          setMessages([])
          setMessagePage(null)
          setIsLoading(false)
          return
        }

        console.log('ChatArea: Fetching chat and messages for chatId:', chatId)
        const [chatData, messagesData] = await Promise.all([
          getChatById(chatId).catch(error => {
            console.error('Failed to fetch chat:', error)
            throw error
          }),
          getMessagesByChat(chatId).catch(error => {
            console.error('Failed to fetch messages:', error)
            throw error
          })
        ])

        console.log('ChatArea: Received chat data:', chatData)
        console.log('ChatArea: Received messages:', messagesData)

        if (mounted) {
          // Update state with fetched data immediately
          setChat(chatData)
          setMessages(messagesData.content)
          setMessagePage(messagesData)
          setIsLoading(false)

          // Set up SSE subscription in the background
          console.log('ChatArea: Setting up SSE subscription')
          sseService.current.subscribeToChatUpdates(chatId, (event: ChatEvent) => {
            console.log('Processing event in ChatArea:', event)
            if (event.type === 'NEW_MESSAGE') {
              setMessages(prev => [...prev, event.data])
            }
          }).catch(error => {
            console.error('Failed to set up SSE subscription:', error)
            // Don't throw - SSE failure shouldn't prevent message display
          })
        }
      } catch (error) {
        console.error('ChatArea: Error during data fetch:', error)
        if (mounted) {
          const message = error instanceof ChatServiceError 
            ? error.message 
            : 'Failed to load chat'
          setError(message)
          setIsLoading(false)
        }
      }
    }

    if (chatId || (mode === ChatType.THREAD && chatId === '')) {
      fetchData()
    }

    return () => { 
      mounted = false
      sseService.current.cleanup()
    }
  }, [chatId, isAuthenticated])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      // Handle thread creation if this is a new thread
      let actualChatId = chatId
      if (mode === ChatType.THREAD && chatId === '' && parentMessage) {
        // Create a new thread chat
        const command: CreateChatCommand = {
          name: 'Thread',
          description: '',
          type: ChatType.THREAD,
          members: []
        }
        const threadChat = await createChat(command)
        
        actualChatId = threadChat.id
        
        // Update the parent message with the new threadId
        const updatedParent = await updateMessage(parentMessage.id, {
          ...parentMessage,
          threadId: actualChatId
        })

        // Update the chat state
        setChat(threadChat)
        
        // Notify parent component about the update
        if (onParentUpdate) {
          onParentUpdate(updatedParent)
        }
      }

      if (!actualChatId) return

      await sendMessage(actualChatId, newMessage.trim()) //newly sent message will be displayed anyway due to SSE
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

  // For new threads, show UI even without chat
  if (!chat && mode !== ChatType.THREAD) {
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
          {mode === ChatType.THREAD ? (
            <div className="flex-1">
              <h2 className="font-semibold">Thread</h2>
            </div>
          ) : isEditing ? (
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
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{chat?.name}</h2>
                {chat?.type === ChatType.AI && (
                  <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded">
                    AI Chat
                  </span>
                )}
              </div>
              {chat?.description && (
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
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {mode === ChatType.THREAD && parentMessage && (
            <ChatMessage
              message={parentMessage}
              isReplyAllowed={false}
              isThreadMessage={true}
              className="mt-4 bg-muted/50"
            />
          )}
          {[...messages]
            .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
            .map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
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

