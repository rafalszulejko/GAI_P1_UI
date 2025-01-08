'use client';

import { useAuth0 } from '@auth0/auth0-react';

// Global instance for non-hook usage
let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;
let tokenPromise: Promise<string> | null = null;

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

  // If there's an ongoing token request, return that instead of making a new one
  if (tokenPromise) {
    return tokenPromise;
  }

  // If we're in a browser context and the window object exists
  if (typeof window !== 'undefined') {
    const auth0Client = (window as any).auth0Client;
    if (auth0Client) {
      try {
        const newTokenPromise = auth0Client.getAccessTokenSilently();
        tokenPromise = newTokenPromise;
        const token = await newTokenPromise;
        accessToken = token;
        tokenExpiryTime = Date.now() + 3600000; // 1 hour expiry
        tokenPromise = null;
        return token;
      } catch (error) {
        tokenPromise = null;
        throw new Error('Failed to get access token');
      }
    }
  }
  
  throw new Error('No valid token available. Ensure user is authenticated.');
}

export function clearAuthToken() {
  accessToken = null;
  tokenExpiryTime = null;
  tokenPromise = null;
} 