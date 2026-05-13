import { api } from '@/lib/axios';

export const agentService = {
  getAll: async () => {
    const response = await api.get('/agents');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/agents', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  }
};
