import { api } from '@/lib/axios';

export const discountService = {
  getAllActive: async () => {
    const response = await api.get('/discounts');
    return response.data;
  }
};
