'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function CallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('Callback page - Loading:', isLoading, 'Authenticated:', isAuthenticated)
    
    // Once loading is complete, redirect based on auth state
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('Callback page - Authenticated, redirecting to /chat')
        router.push('/chat')
      } else {
        console.log('Callback page - Not authenticated, redirecting to /')
        router.push('/')
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Finalizing login...</div>
    </div>
  );
} 