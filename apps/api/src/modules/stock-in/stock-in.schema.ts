import { z } from 'zod';
import { WATER_SIZES } from '../../constants/waterSizes';

export const createStockInSchema = z.object({
  productId: z.string({ error: 'Produk wajib dipilih' }).uuid('Product ID tidak valid'),
  quantity: z.coerce.number({ error: 'Jumlah wajib diisi' }).int().min(1, 'Jumlah minimal 1').max(99999),
  pricePerUnit: z.coerce.number({ error: 'Harga wajib diisi' }).min(0),
  supplier: z.string().max(150).optional(),
  supplierId: z.string().uuid('Supplier ID tidak valid').optional(),
  entryDate: z.string({ error: 'Tanggal masuk wajib diisi' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  notes: z.string().optional(),
  size: z.enum(WATER_SIZES).optional(),
});

export const updateStockInSchema = createStockInSchema.partial();

export type CreateStockInDto = z.infer<typeof createStockInSchema>;
export type UpdateStockInDto = z.infer<typeof updateStockInSchema>;
