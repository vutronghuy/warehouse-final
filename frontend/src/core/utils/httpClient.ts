import { AxiosInstance } from 'axios';

import { BaseClient } from './baseClient';

export const httpClient: AxiosInstance = new BaseClient({
  baseURL: import.meta.env.VITE_API_URL,
}).create();
