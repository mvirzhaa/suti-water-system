import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/axios';

// Definisi tipe data User sesuai backend
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'PIMPINAN' | 'STAFF';
  avatarUrl?: string | null;
  phone?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => 
        set({ accessToken, isAuthenticated: !!accessToken }),
        
      updateUser: (data) => 
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),

      logout: async () => {
        try {
          // Panggil endpoint logout backend untuk membersihkan cookie refresh token
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          // Hapus state lokal terlepas backend sukses/gagal
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      fetchProfile: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      }
    }),
    {
      name: 'suti-auth-storage', // Key di localStorage
      // Jangan simpan seluruh state (kalau mau aman, accessToken jangan di persist, 
      // tapi untuk kesederhanaan SPA kita persist saja, atau kita bisa partialize)
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);
