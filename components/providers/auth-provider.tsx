'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { getToken, isAuthenticated, isLoading, user, logout, login } = useAuthStore()
  return { getToken, isAuthenticated, isLoading, user, logout, login }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(state => state.initialize)
  const isInitialized = useAuthStore(state => state.auth0Client !== null)

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined' && !isInitialized) {
      console.log('AuthProvider: Starting initialization')
      initialize().then(() => {
        console.log('AuthProvider: Initialization complete')
      }).catch(error => {
        console.error('AuthProvider: Initialization failed:', error)
      })
    }
  }, [isInitialized, initialize])

  return <>{children}</>;
} 