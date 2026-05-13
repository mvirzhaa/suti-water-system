import { api } from '@/lib/axios';

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
};
