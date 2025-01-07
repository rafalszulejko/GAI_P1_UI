import { useState } from 'react'
import { User } from '@/types/user'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'

interface UserSettingsProps {
  user: User;
  onSave: (updatedUser: User) => void;
}

export default function UserSettings({ user, onSave }: UserSettingsProps) {
  const [editedUser, setEditedUser] = useState<User>(user)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(editedUser)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={editedUser.profilePicture} alt={editedUser.fullName} />
          <AvatarFallback>{editedUser.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{editedUser.fullName}</h2>
          <p className="text-sm text-muted-foreground">@{editedUser.username}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={editedUser.fullName}
            onChange={(e) => setEditedUser({ ...editedUser, fullName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={editedUser.username}
            onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={editedUser.email}
            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="profilePicture">Profile Picture URL</Label>
          <Input
            id="profilePicture"
            value={editedUser.profilePicture}
            onChange={(e) => setEditedUser({ ...editedUser, profilePicture: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit">Save Changes</Button>
    </form>
  )
}

