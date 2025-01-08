import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, Settings, User, MessageSquare } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearAuthToken } from '@/utils/auth'
import { useAuth0 } from '@auth0/auth0-react'
import { getCurrentUser } from '@/services/userService'

interface NavbarProps {
  onToggleSidebar?: () => void
  mode: 'chat' | 'settings'
  onSwitchMode: () => void
  currentChannel: string
}

export default function Navbar({ mode, onSwitchMode, currentChannel }: NavbarProps) {
  const [userInfo, setUserInfo] = useState<{ username: string; email: string } | null>(null)
  const { toggleSidebar } = useSidebar()
  const { logout, isAuthenticated } = useAuth0()

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const user = await getCurrentUser()
          setUserInfo({ username: user.username, email: user.email })
        } catch (error) {
          console.error('Error fetching user:', error)
        }
      }
    }
    fetchUser()
  }, [isAuthenticated])

  const handleLogout = () => {
    clearAuthToken();
    logout({ 
      logoutParams: {
        returnTo: window.location.origin,
        client_id: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
      }
    });
  };

  return (
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {userInfo && (
            <>
              <div className="px-2 py-1.5 border-b">
                <p className="text-sm font-medium">{userInfo.username}</p>
                <p className="text-xs text-muted-foreground">{userInfo.email}</p>
              </div>
            </>
          )}
          <DropdownMenuItem onClick={onSwitchMode}>
            {mode === 'chat' ? <Settings className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            {mode === 'chat' ? 'Settings' : 'Chat'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <User className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}

