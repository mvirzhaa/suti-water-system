import { api } from '@/lib/axios';

export const stockInService = {
  getAll: async (params?: any) => {
    const response = await api.get('/stock-in', { params });
    return response.data;
  },

  create: async (data: FormData) => {
    // Karena ada upload nota, kita pakai multipart/form-data
    const response = await api.post('/stock-in', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
