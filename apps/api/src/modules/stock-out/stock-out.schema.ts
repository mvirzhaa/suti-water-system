import { z } from 'zod';
import { WATER_SIZES } from '../../constants/waterSizes';

export const createStockOutSchema = z.object({
  productId: z.string({ error: 'Produk wajib dipilih' }).uuid(),
  quantity: z.coerce.number({ error: 'Jumlah wajib diisi' }).int().min(1).max(99999),
  pricePerUnit: z.coerce.number({ error: 'Harga jual wajib diisi' }).min(0),
  discountId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  buyerName: z.string().max(150).optional(),
  exitDate: z.string({ error: 'Tanggal keluar wajib diisi' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  notes: z.string().optional(),
  size: z.enum(WATER_SIZES).optional(),
});

export const updateStockOutSchema = createStockOutSchema.partial();

export type CreateStockOutDto = z.infer<typeof createStockOutSchema>;
export type UpdateStockOutDto = z.infer<typeof updateStockOutSchema>;
