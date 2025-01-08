'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function LandingPage() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <h1 className="text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
        ChatGenius
      </h1>
      <p className="text-xl text-muted-foreground mb-8 text-center max-w-md">
        Experience intelligent conversations with our advanced chat platform
      </p>
      <Button 
        size="lg" 
        onClick={() => loginWithRedirect()}
        className="px-8"
      >
        Sign In
      </Button>
    </div>
  );
}

