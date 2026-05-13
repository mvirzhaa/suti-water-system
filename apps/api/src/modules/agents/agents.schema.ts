import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string({ error: 'Nama agen wajib diisi' }).min(1),
  pic: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentDto = z.infer<typeof createAgentSchema>;
export type UpdateAgentDto = z.infer<typeof updateAgentSchema>;
