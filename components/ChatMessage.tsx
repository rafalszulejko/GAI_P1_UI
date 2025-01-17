import { Message } from '@/types/chat'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Paperclip, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useEffect, useRef } from 'react'
import { uploadAttachment, downloadAttachment } from '@/services/messageService'
import { useToast } from '@/hooks/use-toast'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch user if needed
  useEffect(() => {
    if (message.senderId && !user) {
      fetchUser(message.senderId)
    }
  }, [message.senderId, user, fetchUser])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const attachment = await uploadAttachment(message.id, file)
      message.attachments = [...(message.attachments || []), attachment]
      toast({
        title: "Success",
        description: "File uploaded successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (key: string, filename: string) => {
    try {
      const blob = await downloadAttachment(message.id, key)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      })
    }
  }

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
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((attachment) => (
              <Button
                key={attachment.key}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleDownload(attachment.key, attachment.filename)}
              >
                <Download className="w-3 h-3 mr-1" />
                {attachment.filename}
              </Button>
            ))}
          </div>
        )}
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
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-3 h-3 mr-1" />
              Attach
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>
    </div>
  )
} 