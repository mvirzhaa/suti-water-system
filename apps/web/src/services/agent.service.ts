import { api } from '@/lib/axios';
import type { Agent } from '@/types/api';

type AgentPayload = Omit<Agent, 'id'>;

export const agentService = {
  getAll: async () => {
    const response = await api.get('/agents');
    return response.data;
  },

  create: async (data: AgentPayload) => {
    const response = await api.post('/agents', data);
    return response.data;
  },

  update: async (id: string, data: AgentPayload) => {
    const response = await api.put(`/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  }
};
