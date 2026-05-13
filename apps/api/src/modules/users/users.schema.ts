import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  email: z.string().email('Format email tidak valid').max(150),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.nativeEnum(Role).default(Role.STAFF),
  phone: z.string().max(20).optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100).optional(),
  email: z.string().email('Format email tidak valid').max(150).optional(),
  role: z.nativeEnum(Role).optional(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
