import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Buat instance axios dengan konfigurasi dasar
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Izinkan pengiriman cookie antar origin (penting untuk Refresh Token)
  withCredentials: true,
});

// Interceptor Request: Otomatis tambahkan Access Token dari Zustand
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Handle error 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika error 401 dan bukan sedang nge-hit endpoint refresh/logout
    // (hindari infinite loop: logout → 401 → refresh → gagal → logout → ...)
    const isRefreshOrLogout =
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/logout';

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshOrLogout) {
      originalRequest._retry = true;

      try {
        // Coba minta access token baru pakai refresh token (yg ada di cookie)
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.data.accessToken;
        
        // Simpan token baru ke Zustand
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Ulangi request yang tadinya gagal dengan token baru
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Jika refresh token juga gagal (expired), bersihkan state lokal
        // Jangan panggil logout() di sini karena itu akan bikin request baru → infinite loop
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
