import { AxiosInstance } from 'axios';

import { BaseClient } from './baseClient';

/**
 * This client is for general authenticated API calls.
 * It has token refresh logic.
 */
export const httpClient: AxiosInstance = new BaseClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withActionRefresh: true,
  withActionLogout: true,
}).create();

/**
 * This client is specifically for auth actions like login/refresh.
 * It should NOT have token refresh logic to avoid infinite loops.
 */
export const authApiClient: AxiosInstance = new BaseClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
}).create();
