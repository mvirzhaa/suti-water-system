import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string({ error: 'Nama perusahaan wajib diisi' }).min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
