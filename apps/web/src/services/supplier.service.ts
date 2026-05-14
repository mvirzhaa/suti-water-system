import { api } from '@/lib/axios';
import type { Supplier } from '@/types/api';

type SupplierPayload = Omit<Supplier, 'id'>;

export const supplierService = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  create: async (data: SupplierPayload) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: SupplierPayload) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  }
};
