import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  currentChannel: string
}

type NotificationSetting = 'all' | 'mentions' | 'mute'

export function NotificationsModal({ isOpen, onClose, currentChannel }: NotificationsModalProps) {
  const [globalSetting, setGlobalSetting] = useState<NotificationSetting>('all')
  const [channelSetting, setChannelSetting] = useState<NotificationSetting>('all')

  const handleGlobalChange = (value: NotificationSetting) => {
    setGlobalSetting(value)
    if (value === 'mute') {
      setChannelSetting('mute')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="global-notifications">Global Notifications</Label>
            <Select
              value={globalSetting}
              onValueChange={handleGlobalChange}
            >
              <SelectTrigger id="global-notifications">
                <SelectValue placeholder="Select notification setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All messages</SelectItem>
                <SelectItem value="mentions">Only mentions</SelectItem>
                <SelectItem value="mute">Mute everything</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`channel-${currentChannel}`}>{currentChannel} Notifications</Label>
            <Select
              value={channelSetting}
              onValueChange={setChannelSetting}
              disabled={globalSetting === 'mute'}
            >
              <SelectTrigger id={`channel-${currentChannel}`}>
                <SelectValue placeholder="Select notification setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All messages</SelectItem>
                <SelectItem value="mentions">Only mentions</SelectItem>
                <SelectItem value="mute">Mute everything</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

