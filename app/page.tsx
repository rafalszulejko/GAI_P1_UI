'use client';

import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    router.push('/chat');
  }, [isAuthenticated, isLoading, loginWithRedirect, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">
        {isLoading ? 'Loading...' : 'Redirecting...'}
      </div>
    </div>
  );
}

