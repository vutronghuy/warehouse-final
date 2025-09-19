import { authApiClient } from '@/core';

class AuthService {
  async login(username: string, password: string) {
    const res: any = await authApiClient.post('/api/auth/login', {
      username,
      password,
    });

    return res;
  }

  async refreshToken() {
    try {
      console.log('🔄 Attempting to refresh token...');
      const res: any = await authApiClient.post('/api/auth/refresh', null, {
        withCredentials: true,
      });
      console.log('✅ Token refresh successful:', res);
      return res;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
