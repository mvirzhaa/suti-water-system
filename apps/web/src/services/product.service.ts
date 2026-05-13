import { api } from '@/lib/axios';

export const productService = {
  getAll: async (params?: any) => {
    const response = await api.get('/products', { params });
    return response.data;
  }
};
