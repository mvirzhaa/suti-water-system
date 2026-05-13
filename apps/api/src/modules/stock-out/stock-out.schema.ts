import { z } from 'zod';

export const createStockOutSchema = z.object({
  productId: z.string({ error: 'Produk wajib dipilih' }).uuid(),
  quantity: z.number({ error: 'Jumlah wajib diisi' }).int().min(1).max(99999),
  pricePerUnit: z.number({ error: 'Harga jual wajib diisi' }).min(0),
  discountId: z.string().uuid().optional(),
  buyerName: z.string().max(150).optional(),
  exitDate: z.string({ error: 'Tanggal keluar wajib diisi' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  notes: z.string().optional(),
});

export const updateStockOutSchema = createStockOutSchema.partial();

export type CreateStockOutDto = z.infer<typeof createStockOutSchema>;
export type UpdateStockOutDto = z.infer<typeof updateStockOutSchema>;
