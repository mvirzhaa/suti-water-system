import { api } from '@/lib/axios';
import type { Role } from '@/types/api';

type UserPayload = {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  password?: string;
};

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: UserPayload) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: string, data: UserPayload) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
