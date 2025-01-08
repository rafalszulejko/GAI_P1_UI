import { useState } from 'react'
import { Chat, ChatType } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Loader2, Hash, User } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { createChat, ChatServiceError } from '@/services/chatService'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

interface ChatListProps {
  onSelectChat: (chatId: string) => void
  selectedChatId?: string
  chats: Chat[]
  isLoading: boolean
  onChatCreated?: (chat: Chat) => void
}

export default function ChatList({ onSelectChat, selectedChatId, chats, isLoading, onChatCreated }: ChatListProps) {
  const [error, setError] = useState<string | null>(null)
  const { getToken, isAuthenticated } = useAuth()

  // Filter chats into channels and direct messages
  const channels = chats.filter(chat => chat.type === ChatType.CHANNEL)
  const directMessages = chats.filter(chat => chat.type === ChatType.DIRECT)

  const handleCreateChat = async (type: ChatType) => {
    if (!isAuthenticated) return
    
    try {
      const token = await getToken()
      if (!token) {
        throw new ChatServiceError('No authentication token available')
      }
      const newChat: Partial<Chat> = {
        name: 'New Chat',
        description: 'New chat description',
        type: type,
        lastMessageAt: new Date()
      }
      const chat = await createChat(newChat as Chat, token)
      onSelectChat(chat.id)
      if (onChatCreated) {
        onChatCreated(chat)
      }
    } catch (error) {
      const message = error instanceof ChatServiceError 
        ? error.message 
        : 'Failed to create chat'
      setError(message)
    }
  }

  return (
    <div className="w-64 border-r bg-muted">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-500">
          {error}
        </div>
      ) : chats.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          No chats yet. Create your first chat!
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4">
            <Accordion type="multiple" defaultValue={["channels", "direct-messages"]}>
              <AccordionItem value="channels">
                <AccordionTrigger className="text-sm font-semibold">
                  Channels ({channels.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {channels.map((chat) => (
                      <Button
                        key={chat.id}
                        variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => onSelectChat(chat.id)}
                      >
                        <Hash className="mr-2 h-4 w-4" />
                        {chat.name}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => handleCreateChat(ChatType.CHANNEL)}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Channel
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="direct-messages">
                <AccordionTrigger className="text-sm font-semibold">
                  Direct Messages ({directMessages.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {directMessages.map((chat) => (
                      <Button
                        key={chat.id}
                        variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => onSelectChat(chat.id)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {chat.name}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => handleCreateChat(ChatType.DIRECT)}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Message
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      )}
    </div>
  )
} 