import { api } from '@/lib/axios';

export type DiscountPayload = {
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'NOMINAL';
  value: number;
  applicableTo: 'ALL' | 'PRODUCT';
  minQuantity?: number;
  startDate: string;
  endDate?: string;
  productIds?: string[];
};

export type DiscountRecord = {
  id: string;
  name: string;
  description?: string | null;
  type: 'PERCENTAGE' | 'NOMINAL';
  value: number;
  applicableTo: 'ALL' | 'PRODUCT';
  minQuantity?: number | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
};

export const discountService = {
  getAll: async () => {
    const response = await api.get('/discounts');
    return response.data;
  },

  // Alias untuk kompatibilitas dengan stock-out page
  getAllActive: async () => {
    const response = await api.get('/discounts');
    return response.data;
  },

  create: async (data: DiscountPayload) => {
    const response = await api.post('/discounts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DiscountPayload> & { isActive?: boolean }) => {
    const response = await api.patch(`/discounts/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/discounts/${id}`, { isActive });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
  },
};
