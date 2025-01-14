'use client';

import { useAuth } from '@/components/providers/auth-provider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();

  // No need for useEffect here since our auth store handles initialization
  // and login redirection automatically

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    // Our auth store will handle the redirect
    login();
    return null;
  }

  return <>{children}</>;
} 