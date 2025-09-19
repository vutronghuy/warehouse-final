import { createApp } from 'vue';
import { createPinia } from 'pinia';

import router from '@/router';
import App from './App.vue';

import axios, { InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';

import 'ant-design-vue/dist/reset.css';
import './assets/styles/app.scss';

// --- axios global setup ---
axios.defaults.baseURL = 'http://localhost:3001'; // chỉnh nếu backend chạy port khác
axios.defaults.withCredentials = true; // nếu dùng refresh token trong cookie, cần gửi credentials

// Lấy token (localStorage ưu tiên, fallback sessionStorage)
const initialToken = localStorage.getItem('token') || sessionStorage.getItem('token');
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Interceptor để luôn chèn token nếu có (phòng trường hợp header bị reset)
// Sử dụng đúng kiểu InternalAxiosRequestConfig để TypeScript không báo lỗi
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // đảm bảo config.headers có kiểu phù hợp
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = config.headers as AxiosRequestHeaders;

    // set Authorization nếu chưa có
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// (tùy chọn) helper giải mã token (nếu cần ở frontend)
export function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#__app');
