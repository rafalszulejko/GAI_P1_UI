export const auth0Config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
    scope: 'openid profile email',
  }
}; 