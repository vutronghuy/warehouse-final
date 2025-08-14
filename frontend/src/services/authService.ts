import { AxiosResponse } from 'axios';

import { httpClient } from '@/core';

class AuthService {
  async login(username: string, password: string) {
    const res: AxiosResponse = await httpClient.post('fulfilment/auth/login', {
      username,
      password,
    });

    return res.data;
  }

  async refreshToken() {
    const res: AxiosResponse = await httpClient.post('auth/refresh-token', null, {
      withCredentials: true,
    });

    return res.data;
  }
}

export const authService = new AuthService();
