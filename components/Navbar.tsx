import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, Settings, User, MessageSquare, Bell } from 'lucide-react'
import { SettingsModal } from '@/components/SettingsModal'
import { NotificationsModal } from '@/components/NotificationsModal'
import { useSidebar } from '@/components/ui/sidebar'

interface NavbarProps {
  onToggleSidebar?: () => void
  mode: 'chat' | 'settings'
  onSwitchMode: () => void
  currentChannel: string
}

export default function Navbar({ mode, onSwitchMode, currentChannel }: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { toggleSidebar } = useSidebar()

  return (
    <>
      <nav className="flex items-center justify-between border-b px-4 py-2 bg-muted">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative flex-1 px-4">
          {mode === 'chat' && (
            <Input
              type="search"
              placeholder="Search..."
              className="max-w-sm mx-auto pl-8"
            />
          )}
          {mode === 'settings' && (
            <h1 className="text-lg font-semibold text-center">User Settings</h1>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsNotificationsOpen(true)}>
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSwitchMode}>
            {mode === 'chat' ? <User className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </Button>
        </div>
      </nav>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        currentChannel={currentChannel}
      />
    </>
  )
}

