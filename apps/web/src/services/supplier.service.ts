import { api } from '@/lib/axios';
import type { Supplier } from '@/types/api';

type SupplierPayload = Omit<Supplier, 'id' | 'imageUrl'>;

export const supplierService = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  create: async (data: SupplierPayload, imageFile?: File | null) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (imageFile) formData.append('image', imageFile);

    const response = await api.post('/suppliers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, data: SupplierPayload, imageFile?: File | null) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (imageFile) formData.append('image', imageFile);

    const response = await api.put(`/suppliers/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
};
