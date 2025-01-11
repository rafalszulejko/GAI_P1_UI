import { Message } from '@/types/chat'
import { User } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ChatMessageProps {
  message: Message
  user?: User
  isOnline?: boolean
  isReplyAllowed?: boolean
  isThreadMessage?: boolean
  onReplyClick?: (message: Message) => void
  onThreadClick?: (message: Message) => void
  className?: string
}

export default function ChatMessage({
  message,
  user,
  isOnline = false,
  isReplyAllowed = true,
  isThreadMessage = false,
  onReplyClick,
  onThreadClick,
  className = ''
}: ChatMessageProps) {
  return (
    <div 
      className={`flex items-start gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group ${className}`}
    >
      <Avatar>
        {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
        <AvatarFallback>{user?.username?.[0] ?? message.senderId[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-medium">
          {user?.username ?? message.senderId}
          {isOnline && <span className="ml-2 text-green-500">(online)</span>}
        </div>
        <div className="text-sm">{message.content}</div>
        <div className="text-xs text-gray-500">
          {new Date(message.sentAt).toLocaleString()}
        </div>
        {message.threadId && !isThreadMessage && onThreadClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-gray-500"
            onClick={() => onThreadClick(message)}
          >
            Thread
          </Button>
        )}
      </div>
      {isReplyAllowed && onReplyClick && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="opacity-0 group-hover:opacity-100"
          onClick={() => onReplyClick(message)}
        >
          Reply
        </Button>
      )}
    </div>
  )
} 