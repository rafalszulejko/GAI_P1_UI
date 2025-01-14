import { create } from 'zustand'
import { User } from '@/types/user'
import { getUserById } from '@/services/userService'
import { SSEService } from '@/services/sseService'

interface UserState {
  users: Map<string, User>
  sseService: SSEService
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  fetchUser: (userId: string) => Promise<User>
  updateUserOnlineStatus: (userId: string, isOnline: boolean) => void
  cleanup: () => void
}

const sseService = new SSEService()

export const useUserStore = create<UserState>((set, get) => ({
  users: new Map(),
  sseService,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return

    try {
      // Get initial online users
      const onlineUsers = await sseService.getOnlineUsers()
      onlineUsers.forEach(userId => {
        get().updateUserOnlineStatus(userId, true)
      })
      
      set({ isInitialized: true })
    } catch (error) {
      console.error('Failed to initialize user store:', error)
      set({ isInitialized: true }) // Mark as initialized even on error to prevent retries
    }
  },

  fetchUser: async (userId: string) => {
    const { users } = get()
    const cachedUser = users.get(userId)
    
    if (cachedUser) {
      return cachedUser
    }

    const user = await getUserById(userId)
    set(state => ({
      users: new Map(state.users).set(userId, user)
    }))
    
    return user
  },

  updateUserOnlineStatus: (userId: string, isOnline: boolean) => {
    set(state => {
      const users = new Map(state.users)
      const user = users.get(userId)
      
      if (user) {
        users.set(userId, {
          ...user,
          isOnline,
          lastActive: isOnline ? new Date() : user.lastActive
        })
      }

      return { users }
    })
  },

  cleanup: () => {
    set({
      users: new Map(),
      isInitialized: false
    })
  }
})) 