import { api } from '@/lib/axios';
import type { DashboardSummary } from '@/types/api';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  }
};
