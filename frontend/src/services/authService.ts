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
    const res: any = await authApiClient.post('/api/auth/refresh', null, {
      withCredentials: true,
    });

    return res;
  }
}

export const authService = new AuthService();
