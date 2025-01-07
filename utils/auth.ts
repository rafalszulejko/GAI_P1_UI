'use client';

import { useAuth0 } from '@auth0/auth0-react';

// Global instance for non-hook usage
let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;

export function useAuthToken() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const getToken = async (): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    const token = await getAccessTokenSilently();
    accessToken = token;
    tokenExpiryTime = Date.now() + 3600000; // 1 hour expiry
    return token;
  };

  return {
    getToken,
    isAuthenticated
  };
}

// Non-hook version for services
export async function getAuthToken(): Promise<string> {
  if (accessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return accessToken;
  }
  throw new Error('No valid token available. Ensure user is authenticated.');
}

export function clearAuthToken() {
  accessToken = null;
  tokenExpiryTime = null;
} 