import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, Settings, User, MessageSquare } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearAuthToken } from '@/utils/auth'
import { useAuth0 } from '@auth0/auth0-react'
import { getCurrentUser } from '@/services/userService'
import { searchContent } from '@/services/searchService'
import { SearchType, SearchResults } from '@/types/search'
import { Card } from '@/components/ui/card'

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
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<SearchType[]>([SearchType.MESSAGE, SearchType.USER])
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setSearchQuery('');
        setSearchResults(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults(null)
      return
    }

    try {
      const results = await searchContent(query, selectedTypes)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => handleSearch(value), 300)
  }

  const handleTypeToggle = (type: SearchType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
    if (searchQuery.length >= 3) {
      handleSearch(searchQuery);
    }
  }

  return (
    <nav className="flex items-center justify-between border-b px-4 py-2 bg-muted">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative flex-1 px-4">
        {mode === 'chat' && (
          <div className="max-w-2xl mx-auto" ref={searchContainerRef}>
            <div className="flex items-center gap-4">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {isSearchFocused && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="message-search"
                      checked={selectedTypes.includes(SearchType.MESSAGE)}
                      onCheckedChange={() => handleTypeToggle(SearchType.MESSAGE)}
                    />
                    <label htmlFor="message-search">Messages</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="user-search"
                      checked={selectedTypes.includes(SearchType.USER)}
                      onCheckedChange={() => handleTypeToggle(SearchType.USER)}
                    />
                    <label htmlFor="user-search">Users</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="file-search"
                      disabled
                      checked={selectedTypes.includes(SearchType.FILE)}
                      onCheckedChange={() => handleTypeToggle(SearchType.FILE)}
                    />
                    <label htmlFor="file-search" className="text-muted-foreground">Files</label>
                  </div>
                </div>
              )}
            </div>
            {searchResults && searchQuery.length >= 3 && (
              <Card className="absolute w-full mt-2 p-4 z-50 max-h-96 overflow-y-auto">
                {searchResults.messages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Messages</h3>
                    {searchResults.messages.map((result, i) => (
                      <div key={i} className="p-2 hover:bg-muted rounded-lg">
                        <p className="text-sm font-medium">{result.user.username}</p>
                        <p className="text-sm text-muted-foreground">{result.message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.users.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Users</h3>
                    {searchResults.users.map((user, i) => (
                      <div key={i} className="p-2 hover:bg-muted rounded-lg">
                        <p className="text-sm">{user.username}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
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

