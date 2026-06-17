import { api } from '@/lib/axios';
import type { KulkasRekap, CreateRekapInput, Paginated } from '@/types/kulkas-rekap';

const BASE = '/kulkas-rekap';

export interface RekapListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export const kulkasRekapService = {
  getAll: async (params: RekapListParams = {}): Promise<Paginated<KulkasRekap>> => {
    const res = await api.get(BASE, { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  getById: async (id: string): Promise<KulkasRekap> => {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateRekapInput): Promise<KulkasRekap> => {
    const res = await api.post(BASE, payload);
    return res.data.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data.data;
  },
};
