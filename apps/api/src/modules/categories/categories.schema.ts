import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string({ error: 'Nama wajib diisi' }).min(2).max(100).trim(),
  slug: z.string().min(2).max(100).toLowerCase().trim().optional(),
  icon: z.string().max(50).optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
