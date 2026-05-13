import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string({ error: 'Nama produk wajib diisi' }).min(2).max(150).trim(),
  sku: z.string().max(50).optional(),
  categoryId: z.string().uuid('Category ID tidak valid').optional(),
  unit: z.string().max(30).default('pcs'),
  priceBuy: z.number({ error: 'Harga beli wajib diisi' }).min(0),
  priceSell: z.number({ error: 'Harga jual wajib diisi' }).min(0),
  minStock: z.number().int().min(0).default(5),
  description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
