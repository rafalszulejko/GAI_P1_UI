'use client'

import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const router = useRouter()

  useEffect(() => {
    const handleAuthentication = async () => {
      if (isLoading) return

      if (!isAuthenticated) {
        // Store the current path before redirecting
        const returnTo = window.location.pathname;
        await loginWithRedirect({
          appState: { returnTo }
        });
        return;
      }

      // If authenticated, redirect to /chat
      router.push('/chat');
    }

    handleAuthentication()
  }, [isAuthenticated, isLoading, loginWithRedirect, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">
        {isLoading ? 'Loading...' : 'Redirecting...'}
      </div>
    </div>
  )
} 