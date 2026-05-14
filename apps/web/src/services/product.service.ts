import { api } from '@/lib/axios';

type ProductParams = Record<string, string | number | boolean | undefined>;
type ProductPayload = {
  sku: string;
  name: string;
  description: string;
  unit: 'Kardus' | 'Galon';
  priceSell: number;
  priceBuy: number;
};

export const productService = {
  getAll: async (params?: ProductParams) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  create: async (data: ProductPayload) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id: string, data: ProductPayload) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
