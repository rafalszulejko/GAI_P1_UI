'use client';

import { useAuth0 } from '@auth0/auth0-react';

// Global instance for non-hook usage
let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;
let tokenPromise: Promise<string> | null = null;
let isAuthenticatedGlobal = false;
let getTokenFunction: (() => Promise<string>) | null = null;

export function useAuthToken() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Update global auth state and token function
  if (isAuthenticatedGlobal !== isAuthenticated) {
    isAuthenticatedGlobal = isAuthenticated;
    if (!isAuthenticated) {
      clearAuthToken();
    }
  }

  // Store the token function for non-hook usage
  const tokenFn = async () => {
    const response = await getAccessTokenSilently({
      detailedResponse: true,
      timeoutInSeconds: 60,
      authorizationParams: {
        scope: 'openid profile email offline_access'
      }
    });
    return response.access_token;
  };
  
  getTokenFunction = tokenFn;

  const getToken = async (): Promise<string> => {
    if (!isAuthenticated) {
      clearAuthToken();
      throw new Error('User not authenticated');
    }

    try {
      const token = await tokenFn();
      accessToken = token;
      tokenExpiryTime = Date.now() + 3600000; // 1 hour expiry
      return token;
    } catch (error) {
      clearAuthToken();
      throw error;
    }
  };

  return {
    getToken,
    isAuthenticated
  };
}

// Non-hook version for services
export async function getAuthToken(): Promise<string> {
  if (!isAuthenticatedGlobal) {
    clearAuthToken();
    throw new Error('User not authenticated');
  }

  // If token is still valid, return it
  if (accessToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 300000) { // 5 minutes buffer
    return accessToken;
  }

  // Clear expired token
  if (tokenExpiryTime && Date.now() >= tokenExpiryTime - 300000) {
    clearAuthToken();
  }

  // If there's an ongoing token request, return that instead of making a new one
  if (tokenPromise) {
    try {
      return await tokenPromise;
    } catch (error) {
      tokenPromise = null;
      clearAuthToken();
      throw error;
    }
  }

  if (!getTokenFunction) {
    throw new Error('Auth not initialized. Make sure you are using AuthProvider.');
  }

  try {
    const newTokenPromise = getTokenFunction();
    tokenPromise = newTokenPromise;
    const token = await newTokenPromise;
    accessToken = token;
    tokenExpiryTime = Date.now() + 3600000; // 1 hour expiry
    tokenPromise = null;
    return token;
  } catch (error) {
    tokenPromise = null;
    clearAuthToken();
    throw error;
  }
}

export function clearAuthToken() {
  accessToken = null;
  tokenExpiryTime = null;
  tokenPromise = null;
}

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}; 