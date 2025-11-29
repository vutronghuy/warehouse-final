import axios, { AxiosError, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { message } from 'ant-design-vue';

import { IResponse } from '../interfaces';

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
      window.location.href = `/login?redirect=${encodeURIComponent(
        window.location.href.replace(window.location.origin, ''),
      )}`;
    }

    return this.transformError(error);
  }

  private transformResponse(res: AxiosResponse): IResponse | AxiosResponse {
    if (this.noTransform) {
      return res;
    }

    // Đảm bảo res.data tồn tại và là object
    if (!res || !res.data) {
      return {
        success: false,
        error: true,
        data: null,
        statusCode: res?.status || 500,
        message: 'Invalid response format',
        rawResponse: res,
      };
    }

    const resData = res.data || {};
    const success = !!resData.success;
    return {
      success,
      error: !success,
      data: resData?.data || null,
      statusCode: res?.status,
      message: resData?.message || '',
      rawResponse: res,
    };
  }

  private transformError(error: AxiosError<any, any>): IResponse {
    const res = error.response;

    // Đảm bảo resData luôn là object hợp lệ
    let resData = {};
    if (res?.data) {
      try {
        resData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      } catch (e) {
        resData = { message: res.data };
      }
    }

    // Đảm bảo payload luôn tồn tại
    const payload = resData?.data || resData?.payload || null;

    return {
      success: false,
      error: true,
      data: payload,
      statusCode: res?.status || error.code,
      message: resData?.message || error.message || 'An error occurred',
      rawResponse: res,
    };
  }

  create({ setAuthorizationFn }: ConfigInstance = {}) {
    const defaultSetAuthorizationFn = (config) => {
      // Try to get token from multiple sources
      let token = getAppAccessToken();

      // Fallback to 'token' key (used by login system)
      if (!token) {
        token = localStorage.getItem('token') || sessionStorage.getItem('token');
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No token found for API request:', config.url);
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
        try {
          // Đảm bảo response.data tồn tại trước khi parse
          if (response && response.data !== undefined) {
            const decoded = jsonDecode(response.data);
            response.data = decoded !== null ? decoded : response.data;
          }

          if (isNotifyWhenFail(response) && response.data?.message) {
            message.error(response.data.message);
          }
        } catch (e) {
          console.warn('Error parsing response data:', e);
          // Đảm bảo response.data luôn có giá trị hợp lệ
          if (!response.data) {
            response.data = {};
          }
        }

        return this.transformResponse(response);
      },
      async (error: AxiosError) => {
        const originalRequest: any = error.config;
        const statusCode: any = error?.response?.status;
        const errorResponse: any = error?.response || {};

        try {
          // Đảm bảo errorResponse.data tồn tại trước khi parse
          if (errorResponse.data !== undefined) {
            const decoded = jsonDecode(errorResponse.data);
            errorResponse.data = decoded !== null ? decoded : (errorResponse.data || {});
          } else {
            errorResponse.data = {};
          }
        } catch (e) {
          console.warn('Error parsing error response data:', e);
          errorResponse.data = errorResponse.data || {};
        }

        // Không hiển thị thông báo cho 429 (rate limit)
        if (statusCode === 429) {
          // 静默处理 429 错误，返回一个标记为静默的错误
          const silentError = {
            ...error,
            silent: true,
            response: {
              ...error.response,
              status: 429,
              data: errorResponse.data || {}
            }
          };
          return Promise.reject(silentError);
        }

        if (isNotifyWhenFail(errorResponse) && [422, 400, 403, 402].includes(statusCode)) {
          const errorMessage = errorResponse.data?.message || 'An error occurred';
          message.error(errorMessage);
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
        const { authService } = await import('@/services');
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
