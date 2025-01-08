'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';

export default function CallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const handleCallback = async () => {
      if (!isLoading) {
        try {
          if (isAuthenticated) {
            // Explicitly get the token before redirecting
            await getAccessTokenSilently();
            router.push('/chat');
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Error during callback:', error);
          router.push('/');
        }
      }
    };

    handleCallback();
  }, [isLoading, isAuthenticated, getAccessTokenSilently, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Finalizing login...</div>
    </div>
  );
} 