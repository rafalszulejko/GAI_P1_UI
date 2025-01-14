import { create } from 'zustand'
import { User } from '@/types/user'
import { getCurrentUser } from '@/services/userService'
import { Auth0Client, createAuth0Client, RedirectLoginOptions } from '@auth0/auth0-spa-js'
import { auth0Config } from '@/config/auth0'

interface AuthState {
  auth0Client: Auth0Client | null
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  accessToken: string | null
  tokenExpiryTime: number | null
  
  // Actions
  initialize: () => Promise<void>
  login: () => Promise<void>
  getToken: () => Promise<string>
  getAuthHeaders: () => Promise<Record<string, string>>
  logout: () => Promise<void>
  cleanup: () => void
}

// Create Auth0 client configuration
const auth0ClientOptions = {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  authorizationParams: {
    audience: auth0Config.authorizationParams.audience,
    redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
    scope: 'openid profile email offline_access',
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
} as const

export const useAuthStore = create<AuthState>((set, get) => ({
  auth0Client: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  tokenExpiryTime: null,

  initialize: async () => {
    console.log('Initializing auth store...')
    
    // Skip initialization on server
    if (typeof window === 'undefined') {
      console.log('Skipping auth initialization on server')
      set({ isLoading: false })
      return
    }

    try {
      // Create Auth0 client
      console.log('Creating Auth0 client...')
      const auth0 = await createAuth0Client(auth0ClientOptions)
      console.log('Auth0 client created')

      set({ auth0Client: auth0 })

      // Handle redirect callback
      const query = window.location.search
      if (query.includes('code=') || query.includes('error=') || query.includes('state=')) {
        console.log('Handling redirect callback')
        await auth0.handleRedirectCallback()
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      // Check authentication first
      const isAuthenticated = await auth0.isAuthenticated()
      console.log('Is authenticated:', isAuthenticated)

      if (isAuthenticated) {
        try {
          // Get token first
          console.log('Getting token...')
          const token = await auth0.getTokenSilently()
          set({ 
            accessToken: token,
            tokenExpiryTime: Date.now() + 3600000, // 1 hour expiry
          })

          // Then try to get user data
          console.log('Getting user data...')
          const user = await getCurrentUser()
            
          console.log('Successfully got user data')
          set({ 
            isAuthenticated: true,
            user,
            isLoading: false
          })
        } catch (error) {
          console.log('Failed to get user data:', error)
          set({ 
            isAuthenticated: false,
            accessToken: null,
            tokenExpiryTime: null,
            isLoading: false 
          })
          // If we fail to get user data, we should redirect to login
          get().login()
        }
      } else {
        set({ 
          isAuthenticated: false,
          isLoading: false 
        })
        console.log('Not authenticated, redirecting to login...')
        // Automatically redirect to login if not authenticated
        get().login()
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({ 
        isAuthenticated: false,
        isLoading: false 
      })
      // If initialization fails, we should also redirect to login
      get().login()
    }
  },

  getToken: async () => {
    const { auth0Client, accessToken, tokenExpiryTime } = get()
    
    if (!auth0Client) {
      throw new Error('Auth not initialized')
    }

    try {
      // Return cached token if it's still valid (with 5 minute buffer)
      if (accessToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 300000) {
        return accessToken
      }

      // Get new token
      const token = await auth0Client.getTokenSilently()
      set({ 
        accessToken: token,
        tokenExpiryTime: Date.now() + 3600000 // 1 hour expiry
      })
      return token
    } catch (error) {
      console.error('Failed to get token:', error)
      
      // Handle invalid tokens
      if (error instanceof Error && 
          (error.message.includes('invalid_grant') || 
           error.message.includes('invalid refresh token'))) {
        await get().logout()
      }
      throw error
    }
  },

  getAuthHeaders: async () => {
    const token = await get().getToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  login: async () => {
    console.log('Login called')
    const { auth0Client, isLoading } = get()

    // Skip if we're on the server
    if (typeof window === 'undefined') {
      console.log('Skipping login on server')
      return
    }

    // Prevent multiple login attempts
    if (isLoading) {
      console.log('Already loading, skipping login')
      return
    }

    try {
      let client = auth0Client
      if (!client) {
        console.log('No auth0 client available, creating new one...')
        client = await createAuth0Client(auth0ClientOptions)
        set({ auth0Client: client })
      }

      console.log('Redirecting to login...')
      const options: RedirectLoginOptions = {
        authorizationParams: {
          ...auth0ClientOptions.authorizationParams,
          redirect_uri: `${window.location.origin}/auth/callback`,
        },
        appState: { returnTo: window.location.pathname }
      }
      
      await client.loginWithRedirect(options)
    } catch (error) {
      console.error('Failed to login:', error)
      set({ isLoading: false })
    }
  },

  logout: async () => {
    const { auth0Client } = get()
    if (!auth0Client) return

    try {
      await auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      })
      get().cleanup()
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  },

  cleanup: () => {
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      tokenExpiryTime: null
    })
  }
})) 