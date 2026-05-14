import { api } from '@/lib/axios';
import { z } from 'zod';

// Zod Schema untuk validasi Frontend (sama dengan Backend)
export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
type RegisterPayload = Omit<RegisterFormData, 'confirmPassword'>;


export const authService = {
  login: async (data: LoginFormData) => {
    const response = await api.post('/auth/login', data);
    return response.data; // Mengembalikan { success, message, data: { user, accessToken } }
  },
  
  register: async (data: RegisterPayload) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getGoogleAuthUrl: () => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/google`;
  }
};
