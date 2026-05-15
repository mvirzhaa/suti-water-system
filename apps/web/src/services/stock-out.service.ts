import { api } from '@/lib/axios';
import type { QueryParams } from '@/types/api';

export const stockOutService = {
  getAll: async (params?: QueryParams) => {
    const response = await api.get('/stock-out', { params });
    return response.data;
  },

  create: async (data: FormData) => {
    // Pakai FormData karena ada kemungkinan upload dokumen pengiriman
    const response = await api.post('/stock-out', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/stock-out/${id}`);
    return response.data;
  },
};
