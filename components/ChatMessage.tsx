import { Message } from '@/types/chat'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useEffect } from 'react'

interface ChatMessageProps {
  message: Message
  isReplyAllowed?: boolean
  isThreadMessage?: boolean
  onReplyClick?: (message: Message) => void
  onThreadClick?: (message: Message) => void
  className?: string
}

export default function ChatMessage({
  message,
  isReplyAllowed = true,
  isThreadMessage = false,
  onReplyClick,
  onThreadClick,
  className
}: ChatMessageProps) {
  const user = useUserStore(state => state.users.get(message.senderId))
  const fetchUser = useUserStore(state => state.fetchUser)

  // Fetch user if needed
  useEffect(() => {
    if (message.senderId && !user) {
      fetchUser(message.senderId)
    }
  }, [message.senderId, user, fetchUser])

  return (
    <div className={cn('flex items-start gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group', className)}>
      <Avatar>
        {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
        <AvatarFallback>{user?.username?.[0] ?? message.senderId[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {user?.username || 'Unknown User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.sentAt), 'MMM d, h:mm a')}
          </span>
          {user?.isOnline && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
        </div>
        <p className="text-sm">{message.content}</p>
        {isReplyAllowed && onReplyClick && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => onReplyClick(message)}
            >
              Reply
            </Button>
            {!isThreadMessage && message.threadId && onThreadClick && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => onThreadClick(message)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                View Thread
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 