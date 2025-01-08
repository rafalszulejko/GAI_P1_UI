'use client';

import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { auth0Config } from '@/config/auth0';
import { useRouter } from 'next/navigation';
import { createContext, useContext } from 'react';

interface AuthContextType {
  getToken: () => Promise<string | undefined>;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  const origin = window.location.origin;

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: `${origin}/auth/callback`,
        audience: auth0Config.authorizationParams.audience,
        scope: auth0Config.authorizationParams.scope,
        response_type: auth0Config.authorizationParams.response_type
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useFormData={false}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  );
}

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { getAccessTokenSilently, isAuthenticated, isLoading, user } = useAuth0();

  const getToken = async () => {
    try {
      if (!isAuthenticated) {
        return undefined;
      }
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: auth0Config.authorizationParams.audience,
          scope: auth0Config.authorizationParams.scope,
        },
      });
    } catch (error) {
      console.error('Failed to get token:', error);
      return undefined;
    }
  };

  return (
    <AuthContext.Provider value={{ getToken, isAuthenticated, isLoading, user }}>
      {children}
    </AuthContext.Provider>
  );
} 