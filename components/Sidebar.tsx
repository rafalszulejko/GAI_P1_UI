import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Hash, User, Bell, Shield, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUserChats } from '@/services/chatService'
import { Chat, ChatType } from '@/types/chat'
import { useAuth0 } from '@auth0/auth0-react'

interface SidebarProps {
  isOpen: boolean
  onSelectChat?: (chatId: string) => void
  currentChat?: string
  mode: 'chat' | 'settings'
  onSelectSettingsSection?: (section: string) => void
  currentSettingsSection?: string
}

export default function Sidebar({ 
  isOpen, 
  onSelectChat, 
  currentChat, 
  mode, 
  onSelectSettingsSection, 
  currentSettingsSection 
}: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [error, setError] = useState<string>('')
  const { getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = await getAccessTokenSilently()
        if (!token) return
        
        const userChats = await getUserChats(token)
        // Filter to only show channels
        const channels = userChats.filter(chat => chat.type === ChatType.CHANNEL)
        setChats(channels)
      } catch (err) {
        setError('Failed to fetch chats')
        console.error('Error fetching chats:', err)
      }
    }

    if (mode === 'chat') {
      fetchChats()
    }
  }, [mode, getAccessTokenSilently])

  const settingsSections = [
    { name: 'Profile', icon: User },
    { name: 'Notifications', icon: Bell },
    { name: 'Privacy', icon: Shield },
    { name: 'Help', icon: HelpCircle },
  ]

  if (!isOpen) return null

  return (
    <div className="w-64 border-r bg-muted">
      <ScrollArea className="h-full">
        <div className="p-4">
          <h2 className="mb-2 text-lg font-semibold">
            {mode === 'chat' ? 'Channels' : 'Settings'}
          </h2>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          {mode === 'chat' && chats.map((chat) => (
            <Button
              key={chat.id}
              variant={chat.id === currentChat ? "secondary" : "ghost"}
              className={`w-full justify-start ${chat.id === currentChat ? 'bg-accent font-bold' : ''}`}
              onClick={() => onSelectChat && onSelectChat(chat.id)}
            >
              <Hash className="mr-2 h-4 w-4" />
              {chat.name}
            </Button>
          ))}
          {mode === 'settings' && settingsSections.map((section) => (
            <Button
              key={section.name}
              variant={section.name === currentSettingsSection ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSelectSettingsSection && onSelectSettingsSection(section.name)}
            >
              <section.icon className="mr-2 h-4 w-4" />
              {section.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

