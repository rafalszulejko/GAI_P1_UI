import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, User, MessageSquare } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/components/providers/auth-provider'
import { searchContent } from '@/services/searchService'
import { SearchType, SearchResults } from '@/types/search'
import { Card } from '@/components/ui/card'

interface NavbarProps {
  onToggleSidebar?: () => void
  currentChannel: string
}

export default function Navbar({ currentChannel }: NavbarProps) {
  const { toggleSidebar } = useSidebar()
  const { logout, isAuthenticated, user } = useAuth()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
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

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults(null)
      return
    }

    try {
      const results = await searchContent(query, [SearchType.MESSAGE, SearchType.USER, SearchType.FILE, SearchType.AI])
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

  return (
    <nav className="flex items-center justify-between border-b px-4 py-2 bg-muted">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative flex-1 px-4">
        <div className="max-w-2xl mx-auto" ref={searchContainerRef}>
          <div className="flex items-center gap-4">
            <Input
              type="search"
              placeholder="Search... (add space at the end for AI search)"
              className="w-full"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
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
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Users</h3>
                  {searchResults.users.map((user, i) => (
                    <div key={i} className="p-2 hover:bg-muted rounded-lg">
                      <p className="text-sm">{user.username}</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.ai && (
                <div>
                  <h3 className="font-semibold mb-2">AI Search</h3>
                  <p className="text-sm font-bold mb-2">{searchResults.ai.summary}</p>
                  {searchResults.ai.messages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">AI-found related messages:</h4>
                      {searchResults.ai.messages.map((message, i) => (
                        <div key={i} className="p-2 hover:bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user && (
            <>
              <div className="px-2 py-1.5 border-b">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </>
          )}
          <DropdownMenuItem onClick={handleLogout}>
            <User className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}

