'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useAuthToken } from '@/utils/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { getToken } = useAuthToken();

  useEffect(() => {
    const initAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        await loginWithRedirect({
          appState: { returnTo: window.location.pathname }
        });
      } else if (isAuthenticated) {
        try {
          await getToken();
        } catch (error) {
          console.error('Failed to get token:', error);
        }
      }
    };

    initAuth();
  }, [isAuthenticated, isLoading, loginWithRedirect, getToken]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 