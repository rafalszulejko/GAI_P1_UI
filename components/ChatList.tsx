import { useState, useEffect } from 'react'
import { Chat, ChatType } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Loader2, Hash, User, Search } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { createChat, ChatServiceError, getAllChats } from '@/services/chatService'
import { getCurrentUser } from '@/services/userService'
import { addChatMember } from '@/services/chatMemberService'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useAuth0 } from '@auth0/auth0-react'
import { clearAuthToken } from '@/utils/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatListProps {
  onSelectChat: (chatId: string) => void
  selectedChatId?: string
  chats: Chat[]
  isLoading: boolean
  onChatCreated?: (chat: Chat) => void
}

export default function ChatList({ onSelectChat, selectedChatId, chats, isLoading, onChatCreated }: ChatListProps) {
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [availableChannels, setAvailableChannels] = useState<Chat[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const { getToken, isAuthenticated } = useAuth()
  const { logout } = useAuth0()

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const user = await getCurrentUser()
          setUserName(user.username)
          setUserId(user.id)
        } catch (error) {
          console.error('Failed to fetch user:', error)
        }
      }
    }
    fetchUser()
  }, [isAuthenticated])

  const handleBrowseChannels = async () => {
    if (!isAuthenticated) return
    
    try {
      setIsLoadingChannels(true)
      const token = await getToken()
      if (!token) {
        throw new ChatServiceError('No authentication token available')
      }
      
      const allChats = await getAllChats(token)
      // Filter to only show channels that the user is not a member of
      const userChatIds = new Set(chats.map(chat => chat.id))
      const availableChats = allChats.filter(
        chat => chat.type === ChatType.CHANNEL && !userChatIds.has(chat.id)
      )
      
      setAvailableChannels(availableChats)
      setIsBrowseModalOpen(true)
    } catch (error) {
      const message = error instanceof ChatServiceError 
        ? error.message 
        : 'Failed to fetch available channels'
      setError(message)
    } finally {
      setIsLoadingChannels(false)
    }
  }

  const handleJoinChannel = async () => {
    if (!isAuthenticated || !selectedChannelId || !userId) return
    
    try {
      const token = await getToken()
      if (!token) {
        throw new ChatServiceError('No authentication token available')
      }
      
      await addChatMember(selectedChannelId, userId, token)
      const selectedChannel = availableChannels.find(c => c.id === selectedChannelId)
      if (selectedChannel && onChatCreated) {
        onChatCreated(selectedChannel)
      }
      onSelectChat(selectedChannelId)
      setSelectedChannelId('')
      setIsBrowseModalOpen(false)
    } catch (error) {
      const message = error instanceof ChatServiceError 
        ? error.message 
        : 'Failed to join channel'
      setError(message)
    }
  }

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
        name: newChannelName || 'New Chat',
        description: newChannelDescription || 'New chat description',
        type: type,
        lastMessageAt: new Date()
      }
      const chat = await createChat(newChat as Chat, token)
      onSelectChat(chat.id)
      if (onChatCreated) {
        onChatCreated(chat)
      }
      // Reset form and close modal
      setNewChannelName('')
      setNewChannelDescription('')
      setIsCreateModalOpen(false)
    } catch (error) {
      const message = error instanceof ChatServiceError 
        ? error.message 
        : 'Failed to create chat'
      setError(message)
    }
  }

  const handleLogout = () => {
    // Clear local auth token
    clearAuthToken();
    // Logout from Auth0 and redirect to home page
    logout({ 
      logoutParams: {
        returnTo: window.location.origin 
      }
    });
  };

  return (
    <div className="w-64 border-r bg-muted">
      {userName && (
        <div className="p-4 border-b">
          <p className="text-sm font-medium">Welcome, {userName}</p>
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-500">
          {error}
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
                    {channels.length > 0 ? (
                      channels.map((chat) => (
                        <Button
                          key={chat.id}
                          variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => onSelectChat(chat.id)}
                        >
                          <Hash className="mr-2 h-4 w-4" />
                          {chat.name}
                        </Button>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No channels yet
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground"
                          disabled={isLoading}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Channel
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem 
                          onClick={handleBrowseChannels}
                          disabled={isLoadingChannels}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          Browse Channels
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="direct-messages">
                <AccordionTrigger className="text-sm font-semibold">
                  Direct Messages ({directMessages.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {directMessages.length > 0 ? (
                      directMessages.map((chat) => (
                        <Button
                          key={chat.id}
                          variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => onSelectChat(chat.id)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          {chat.name}
                        </Button>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No direct messages yet
                      </div>
                    )}
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
      <Button 
        variant="outline" 
        onClick={handleLogout}
        className="w-full mt-auto mb-4"
      >
        Logout
      </Button>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                placeholder="e.g. project-discussion"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Channel Description</Label>
              <Textarea
                id="description"
                placeholder="What's this channel about?"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateChat(ChatType.CHANNEL)}
              disabled={!newChannelName.trim()}
            >
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBrowseModalOpen} onOpenChange={setIsBrowseModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Browse Channels</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingChannels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableChannels.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No available channels to join
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-1">
                  {availableChannels.map((chat) => (
                    <Button
                      key={chat.id}
                      variant={selectedChannelId === chat.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedChannelId(chat.id)}
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>{chat.name}</span>
                        {chat.description && (
                          <span className="text-xs text-muted-foreground">
                            {chat.description}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedChannelId('')
                setIsBrowseModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinChannel}
              disabled={!selectedChannelId}
            >
              Join Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 