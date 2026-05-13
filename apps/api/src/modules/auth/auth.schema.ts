import { z } from 'zod';

// Zod v4: gunakan { error: "..." } bukan { required_error: "..." }
export const registerSchema = z.object({
  name: z
    .string({ error: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .trim(),
  email: z
    .string({ error: 'Email wajib diisi' })
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email wajib diisi' })
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(1, 'Password wajib diisi'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z
    .string()
    .min(8, 'Password baru minimal 8 karakter')
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
