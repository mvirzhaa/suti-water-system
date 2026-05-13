import { z } from 'zod';

export const createDiscountSchema = z.object({
  name: z.string({ error: 'Nama diskon wajib diisi' }).min(2).max(100).trim(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'NOMINAL'], { error: 'Tipe harus PERCENTAGE atau NOMINAL' }),
  value: z.number({ error: 'Nilai diskon wajib diisi' }).positive('Nilai harus lebih dari 0'),
  applicableTo: z.enum(['ALL', 'PRODUCT']).default('ALL'),
  minQuantity: z.number().int().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  productIds: z.array(z.string().uuid()).optional(),
});

export const updateDiscountSchema = createDiscountSchema.partial();

export type CreateDiscountDto = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountDto = z.infer<typeof updateDiscountSchema>;
