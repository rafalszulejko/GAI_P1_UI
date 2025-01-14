'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    console.log('RequireAuth effect - Loading:', isLoading, 'Authenticated:', isAuthenticated)
    
    // Only attempt login if we're not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, initiating login...')
      login()
    }
  }, [isLoading, isAuthenticated, login]);

  // Show loading only if we're in the initial loading state
  if (isLoading) {
    console.log('RequireAuth - Loading state')
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  // If we're not loading and authenticated, show content
  if (isAuthenticated) {
    console.log('RequireAuth - Authenticated, showing content')
    return <>{children}</>;
  }

  // If we're not loading and not authenticated, show nothing while login redirect happens
  console.log('RequireAuth - Not authenticated, showing nothing')
  return null;
} 