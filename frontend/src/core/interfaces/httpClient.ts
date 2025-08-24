import { AxiosRequestConfig } from 'axios';

export interface IResponse {
  data?: any;
  statusCode?: number | string;
  success: boolean;
  error: boolean;
  message?: string;
  rawResponse?: any;
}

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  offNotify?: boolean;
  offRefreshToken?: boolean;
}
