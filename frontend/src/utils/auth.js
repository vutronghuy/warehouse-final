/**
 * Auth utility functions
 */

/**
 * Handle authentication errors and redirect if needed
 * @param {Object} error - Axios error object
 * @param {Object} router - Vue router instance
 * @returns {boolean} - Returns true if error was handled (redirect occurred)
 */
export function handleAuthError(error, router) {
  if (error.response?.status === 401) {
    const errorData = error.response.data;

    // Check for JWT malformed or expired errors
    if (
      errorData.error === 'jwt_malformed' ||
      errorData.message?.includes('malformed') ||
      errorData.message?.includes('token_expired') ||
      errorData.message?.includes('Invalid or expired token')
    ) {
      console.log('🔄 Auth error detected, clearing token and redirecting to login');

      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Redirect to login
      if (router) {
        router.push('/login');
      } else {
        window.location.href = '/login';
      }

      return true; // Error was handled
    }
  }

  return false; // Error was not handled
}

/**
 * Get token from localStorage/sessionStorage with validation
 * @returns {string|null} - Valid token or null
 */
export function getValidToken() {
  // Try localStorage first, then sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    console.log('🔍 No token found in localStorage or sessionStorage');
    return null;
  }

  console.log('🔍 Found token:', {
    length: token.length,
    source: localStorage.getItem('token') ? 'localStorage' : 'sessionStorage',
    start: token.substring(0, 20) + '...'
  });

  // Basic JWT format validation (3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.warn('⚠️ Invalid token format detected, removing from storage');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return null;
  }

  return token;
}

/**
 * Check if user is authenticated with valid token
 * @returns {boolean}
 */
export function isAuthenticated() {
  const token = getValidToken();
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');

  return !!(token && user);
}

/**
 * Logout user and clear all auth data
 * @param {Object} router - Vue router instance (optional)
 */
export function logout(router = null) {
  console.log('🚪 Logging out user');

  // Clear all auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  // Redirect to login
  if (router) {
    router.push('/login');
  } else {
    window.location.href = '/login';
  }
}

/**
 * Get authorization headers for API requests
 * @returns {Object|null} - Headers object or null if no valid token
 */
export function getAuthHeaders() {
  const token = getValidToken();

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`
  };
}
