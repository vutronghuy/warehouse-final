const env = import.meta.env;

export const oidc = {
  clientId: env.VITE_OIDC_CLIENT_ID,
  issuer: env.VITE_OIDC_ISSUER || 'https://auth.ghtklab.com',
  redirectUri: `${window.location.origin}/callback`,
  scopes: ['openid'],
  pkce: true,
  isAuthzBackground: false,
  authnUrl: env.VITE_OIDC_AUTH_URL,
};
