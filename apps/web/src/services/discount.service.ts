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

export const discountService = {
  getAllActive: async () => {
    const response = await api.get('/discounts');
    return response.data;
  },

  create: async (data: DiscountPayload) => {
    const response = await api.post('/discounts', data);
    return response.data;
  },
};
