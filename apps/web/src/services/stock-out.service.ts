import { api } from '@/lib/axios';

export const stockOutService = {
  getAll: async (params?: any) => {
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
};
