import { create } from 'zustand'
import { User } from '@/types/user'
import { getCurrentUser, getUserById } from '@/services/userService'
import { SSEService } from '@/services/sseService'

interface UserState {
  currentUser: User | null
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
  currentUser: null,
  users: new Map(),
  sseService,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return

    try {
      const currentUser = await getCurrentUser()
      set({ currentUser, isInitialized: true })

      // Get initial online users
      const onlineUsers = await sseService.getOnlineUsers()
      onlineUsers.forEach(userId => {
        get().updateUserOnlineStatus(userId, true)
      })
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

      // Also update currentUser if it's the same user
      const currentUser = state.currentUser
      if (currentUser?.id === userId) {
        return {
          users,
          currentUser: {
            ...currentUser,
            isOnline,
            lastActive: isOnline ? new Date() : currentUser.lastActive
          }
        }
      }

      return { users }
    })
  },

  cleanup: () => {
    set({
      currentUser: null,
      users: new Map(),
      isInitialized: false
    })
  }
})) 