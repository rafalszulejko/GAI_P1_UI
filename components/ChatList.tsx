import { useState, useEffect } from 'react'
import { Chat, ChatType } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Loader2, Hash, User as UserIcon, Search, X } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { createChat, ChatServiceError, getAllChats } from '@/services/chatService'
import { addChatMember, getChatMembers, withoutUser } from '@/services/chatMemberService'
import { searchContent } from '@/services/searchService'
import { SearchType } from '@/types/search'
import { useUserStore } from '@/store/userStore'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
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
import { sendMessage } from '@/services/messageService'
import { CreateChatCommand } from '@/types/chat'

interface ChatListProps {
  onSelectChat: (chatId: string) => void
  selectedChatId?: string
  chats: Chat[]
  isLoading: boolean
  onChatCreated?: (chat: Chat) => void
}

interface SelectedUser {
  id: string;
  name: string;
}

export default function ChatList({ onSelectChat, selectedChatId, chats, isLoading, onChatCreated }: ChatListProps) {
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [availableChannels, setAvailableChannels] = useState<Chat[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const { getToken, isAuthenticated, user: currentUser } = useAuth()
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)
  const [messageText, setMessageText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [otherUserIds, setOtherUserIds] = useState<Record<string, string>>({})
  const users = useUserStore(state => state.users)
  const fetchUser = useUserStore(state => state.fetchUser)

  useEffect(() => {
    const fetchOtherUserIds = async () => {
      if (!currentUser) return;
      
      const directChats = chats.filter(chat => chat.type === ChatType.DIRECT);
      const newUserIds: Record<string, string> = {};
      
      for (const chat of directChats) {
        try {
          const members = await getChatMembers(chat.id);
          const otherMembers = withoutUser(members, currentUser.id);
          if (otherMembers.length > 0) {
            const userId = otherMembers[0].userId;
            newUserIds[chat.id] = userId;
            // Fetch user data
            fetchUser(userId);
          }
        } catch (error) {
          console.error('Error fetching other user ID for chat:', chat.id, error);
        }
      }
      
      setOtherUserIds(newUserIds);
    };

    fetchOtherUserIds();
  }, [chats, currentUser, fetchUser]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true)
        try {
          const results = await searchContent(searchQuery, [SearchType.USER])
          setSearchResults(results.users || [])
        } catch (error) {
          console.error('Error searching users:', error)
          setError('Failed to search users')
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }

    const debounceTimeout = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchQuery])

  const handleBrowseChannels = async () => {
    if (!isAuthenticated) return
    
    try {
      setIsLoadingChannels(true)
      const allChats = await getAllChats()
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
    if (!isAuthenticated || !selectedChannelId || !currentUser) return
    
    try {
      await addChatMember(selectedChannelId, currentUser.id)
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
      const command: CreateChatCommand = {
        name: newChannelName || 'New Chat',
        description: newChannelDescription || 'New chat description',
        type: type,
        members: []
      }
      const chat = await createChat(command)
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

  const handleCreateDirectMessage = async () => {
    if (!selectedUser || !messageText.trim() || !currentUser) return

    try {
      // Create new chat
      const command: CreateChatCommand = {
        name: `${currentUser.username}-${selectedUser.name} DM`,
        description: '',
        type: ChatType.DIRECT,
        members: [selectedUser.id]
      }
      const newChat = await createChat(command)

      // Send the initial message
      await sendMessage(newChat.id, messageText)

      // Select the new chat
      onSelectChat(newChat.id)
      if (onChatCreated) {
        onChatCreated(newChat)
      }

      // Reset form and close modal
      setSelectedUser(null)
      setMessageText('')
      setSearchQuery('')
      setIsNewMessageModalOpen(false)
    } catch (error) {
      const message = error instanceof ChatServiceError 
        ? error.message 
        : 'Failed to create direct message'
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
                      directMessages.map((chat) => {
                        const otherUserId = otherUserIds[chat.id];
                        const otherUser = users.get(otherUserId);
                        return (
                          <Button
                            key={chat.id}
                            variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => onSelectChat(chat.id)}
                          >
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>
                              {otherUser?.username || `Chat ${chat.id}`}
                            </span>
                          </Button>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No direct messages yet
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setIsNewMessageModalOpen(true)}
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

      <Dialog open={isNewMessageModalOpen} onOpenChange={setIsNewMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To:</Label>
              <div className="relative">
                {selectedUser ? (
                  <div className="flex items-center gap-2 border rounded-md p-2">
                    <div className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm flex items-center gap-1">
                      {selectedUser.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => {
                          setSelectedUser(null)
                          setSearchQuery('')
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />
                    )}
                    {searchResults.length > 0 && !selectedUser && (
                      <ScrollArea className="absolute z-10 mt-1 max-h-48 w-full rounded-md border bg-popover p-1">
                        {searchResults.map((user) => (
                          <Button
                            key={user.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedUser({ id: user.id, name: user.username })
                              setSearchResults([])
                            }}
                          >
                            <UserIcon className="mr-2 h-4 w-4" />
                            <div className="flex flex-col items-start">
                              <span>{user.username}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </Button>
                        ))}
                      </ScrollArea>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewMessageModalOpen(false)
                setSelectedUser(null)
                setMessageText('')
                setSearchQuery('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDirectMessage}
              disabled={!selectedUser || !messageText.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 