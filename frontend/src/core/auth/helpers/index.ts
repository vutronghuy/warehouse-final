import { get } from 'lodash';
import { includes } from 'lodash';

import { jsonDecode, jsonEncode } from '@/helpers';
import { IdStorageName, ID_STORAGE_ALL } from '@/shared/constants';
import { oidc } from '@/shared/constants';

export const APP_ACCESS_TOKEN = 'app_access_token';
export const APP_REFRESH_TOKEN = 'app_refresh_token';

export const authGuard = async ({
  to,
}): Promise<{
  canAccess: boolean;
  redirectTo: any;
}> => {
  console.log('🛡️ authGuard triggered for:', to.path, 'fullPath:', to.fullPath);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot/email', '/forgot/otp', '/forgot/new-password', '/test-routes'];

  // If accessing a public route, allow access
  if (publicRoutes.includes(to.path)) {
    console.log('✅ Public route, allowing access');
    return {
      canAccess: true,
      redirectTo: {},
    };
  }

  // Check if user is authenticated
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log('🔑 Token found:', !!token, 'from localStorage:', !!localStorage.getItem('token'), 'from sessionStorage:', !!sessionStorage.getItem('token'));

  if (!token) {
    // No token, redirect to login
    console.log('❌ No token, redirecting to login');
    return {
      canAccess: false,
      redirectTo: {
        path: '/login',
        query: { redirect: to.fullPath } // Use 'redirect' to match Login.vue
      },
    };
  }

  try {
    // Verify token is valid (basic check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    console.log('📋 Token payload:', {
      role: payload.role,
      isSuperAdmin: payload.isSuperAdmin,
      exp: payload.exp,
      now: now,
      expired: payload.exp && payload.exp < now
    });

    if (payload.exp && payload.exp < now) {
      // Token expired, redirect to login
      console.log('❌ Token expired, redirecting to login');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      return {
        canAccess: false,
        redirectTo: {
          path: '/login',
          query: { redirect: to.fullPath } // Use 'redirect' to match Login.vue
        },
      };
    }

    // Token is valid, allow access
    console.log('✅ Token valid, allowing access');
    return {
      canAccess: true,
      redirectTo: {},
    };
  } catch (error) {
    // Invalid token, redirect to login
    console.error('❌ Invalid token, redirecting to login:', error);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return {
      canAccess: false,
      redirectTo: {
        path: '/login',
        query: { redirect: to.fullPath } // Use 'redirect' to match Login.vue
      },
    };
  }
};

export const authLogout = async (): Promise<void> => {
  spreadIdStorage();
  const ghtkAuth = new window['gmjs'].GhtkAuth(oidc);

  try {
    await ghtkAuth.signOut({
      revokeAccessToken: true,
      postLogoutRedirectUri: `${oidc.authnUrl}/sign-out?continue=${window.location.origin}`,
    });
  } catch (e) {
    window.location.href = `${oidc.authnUrl}/sign-out?continue=${window.location.origin}`;
  } finally {
    localStorage.clear();
  }
};

export const getIdAccessToken = (): string | undefined => {
  const tokenStorage = jsonDecode(localStorage.getItem(IdStorageName.GhtkTokenStorage));

  return get(tokenStorage, 'accessToken.accessToken');
};

export const moveIdStorage = (): void => {
  const allStorage = {};

  Object.keys(IdStorageName).forEach((key) => {
    allStorage[key] = jsonDecode(localStorage.getItem(IdStorageName[key]));
    localStorage.removeItem(IdStorageName[key]);
  });

  localStorage.setItem(ID_STORAGE_ALL, jsonEncode(allStorage) || '{}');
};

export const spreadIdStorage = (): void => {
  const allStorage = jsonDecode(localStorage.getItem(ID_STORAGE_ALL));

  Object.keys(allStorage).forEach((key) => {
    localStorage.setItem(IdStorageName[key], jsonEncode(allStorage[key]) || '');
  });
};

export const getAppAccessToken = (): string | null => {
  return localStorage.getItem(APP_ACCESS_TOKEN);
};

export const getAppRefreshToken = (): string | null => {
  return localStorage.getItem(APP_REFRESH_TOKEN);
};

export const isNoTokenPresent = (): boolean => {
  const accessToken = getAppAccessToken();
  const refreshToken = getAppRefreshToken();

  return !accessToken && !refreshToken;
};

export const setAppToken = (authInfo: any): void => {
  localStorage.setItem(APP_ACCESS_TOKEN, authInfo.access_token);
  localStorage.setItem(APP_REFRESH_TOKEN, authInfo.refresh_token);
};

export const removeAppToken = (): void => {
  localStorage.removeItem(APP_ACCESS_TOKEN);
  localStorage.removeItem(APP_REFRESH_TOKEN);
};

export const canUpdate = (scopes: string[], role: string) => {
  if (includes(scopes, role) || includes(scopes, `${role}.update`)) {
    return true;
  }

  return false;
};

export const onlyView = (scopes: string[], role: string) => {
  if (includes(scopes, role) || includes(scopes, `${role}.update`)) return false;

  return includes(scopes, `${role}.view`);
};

export const viewLimit = (scopes: string[], role: string) => {
  if (includes(scopes, `${role}.update`) || includes(scopes, `${role}.view`)) return false;

  return true;
};

export const getAccessTokenGhtk = (): string | undefined => {
  const tokenStorage = jsonDecode(localStorage.getItem(ID_STORAGE_ALL));

  return get(tokenStorage, 'GhtkTokenStorage.accessToken.accessToken');
};

export const getIdExpiredTime = (): number => {
  const tokenStorage = jsonDecode(localStorage.getItem(ID_STORAGE_ALL));

  return get(tokenStorage, 'GhtkTokenStorage.accessToken.expiresAt');
};
