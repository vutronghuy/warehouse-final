import axios, { AxiosError, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { message } from 'ant-design-vue';

import { IResponse } from '../interfaces';
import { authService } from '@/services';
import { isNotifyWhenFail, jsonDecode } from '@/helpers';
import { getAppAccessToken, removeAppToken, setAppToken } from '@/core/auth';

interface ConfigInstance {
  setAuthorizationFn?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
}

interface Constructor {
  baseURL: string;
  headers?: any;
  noTransform?: boolean;
  withActionRefresh?: boolean;
  withActionLogout?: boolean;
}

export class BaseClient {
  private isRefreshing = false;
  private failedQueue: any[] = [];
  baseURL = '';
  headers: any = {};
  noTransform = false;
  withActionRefresh = false;
  withActionLogout = false;

  constructor({ baseURL, headers, noTransform, withActionRefresh, withActionLogout }: Constructor) {
    this.baseURL = baseURL;
    this.headers = headers;
    this.noTransform = !!noTransform;
    this.withActionRefresh = !!withActionRefresh;
    this.withActionLogout = !!withActionLogout;
  }

  private processQueue(error: AxiosError | null, token = null) {
    this.failedQueue.forEach((item) => {
      if (error) {
        item.reject(error);
      } else {
        item.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private rejectErrorAndClearToken(error: AxiosError) {
    removeAppToken();

    if (this.withActionLogout) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(
        window.location.href.replace(window.location.origin, ''),
      )}`;
    }

    return this.transformError(error);
  }

  private transformResponse(res: AxiosResponse): IResponse | AxiosResponse {
    if (this.noTransform) {
      return res;
    }

    const resData = res.data || {};
    const success = !!resData.success;
    return {
      success,
      error: !success,
      data: resData.data,
      statusCode: res?.status,
      message: resData.message,
      rawResponse: res,
    };
  }

  private transformError(error: AxiosError<any, any>): IResponse {
    const res = error.response;
    const resData = res?.data || {};
    return {
      success: false,
      error: true,
      data: resData.data,
      statusCode: res?.status || error.code,
      message: resData.message || error.message,
      rawResponse: res,
    };
  }

  create({ setAuthorizationFn }: ConfigInstance = {}) {
    const defaultSetAuthorizationFn = (config) => {
      const token = getAppAccessToken();

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    };

    const api: AxiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        ...this.headers,
      },
    });

    api.interceptors.request.use((config) => {
      if (!config.headers) {
        return config;
      }

      config.transformResponse = [(data) => data];

      if (setAuthorizationFn) {
        return setAuthorizationFn(config);
      }

      defaultSetAuthorizationFn(config);

      return config;
    });

    api.interceptors.response.use(
      (response: AxiosResponse): any => {
        response.data = jsonDecode(response.data);
        if (isNotifyWhenFail(response)) {
          message.error(response.data?.message);
        }

        return this.transformResponse(response);
      },
      async (error: AxiosError) => {
        const originalRequest: any = error.config;
        const statusCode: any = error?.response?.status;
        const errorResponse: any = error?.response || {};
        errorResponse.data = jsonDecode(errorResponse.data);

        if (isNotifyWhenFail(errorResponse) && [422, 400, 403, 402].includes(statusCode)) {
          message.error(errorResponse.data?.message);
        }

        if (!this.withActionRefresh) {
          if (statusCode === 401 && this.withActionLogout) {
            return this.rejectErrorAndClearToken(error);
          }

          return this.transformError(error);
        }

        // Prevent refesh token
        if (errorResponse?.config?.offRefreshToken) {
          return this.transformError(error);
        }

        // Only handle when status == 401
        if (statusCode !== 401) {
          return this.transformError(error);
        }

        // Clear token and throw error when retried
        if (originalRequest._retry) {
          return this.rejectErrorAndClearToken(error);
        }

        // If refresh token is not valid and server response status == 401
        if (originalRequest.url === 'v1/auth/refresh-token') {
          return this.rejectErrorAndClearToken(error);
        }

        // Handle if token is refreshing
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        // Set variables
        originalRequest._retry = true;
        this.isRefreshing = true;

        // Call request refresh token
        const res = await authService.refreshToken().finally(() => (this.isRefreshing = false));

        if (res.error) {
          this.processQueue(error);
          return this.rejectErrorAndClearToken(error);
        }

        this.processQueue(null, res.data?.access_token);
        setAppToken(res.data);

        return Promise.resolve(api(originalRequest));
      },
    );

    return api;
  }
}
