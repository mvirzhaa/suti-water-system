import { api } from '@/lib/axios';
import type {
  Refrigerator,
  RefrigeratorFill,
  RefrigeratorSummary,
  RefrigeratorInput,
  FillInput,
  WeeklyReport,
  WeeklyReportInput,
  RecapPreview,
  PageMeta,
} from '@/types/refrigerator';

const BASE = '/refrigerators';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface FillListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface Paginated<T> {
  data: T[];
  meta?: PageMeta;
}

export const refrigeratorService = {
  getAll: async (params: ListParams = {}): Promise<Paginated<Refrigerator>> => {
    const res = await api.get(BASE, { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  getSummary: async (): Promise<RefrigeratorSummary> => {
    const res = await api.get(`${BASE}/summary`);
    return res.data.data;
  },

  getById: async (id: string): Promise<Refrigerator> => {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data;
  },

  create: async (payload: RefrigeratorInput): Promise<Refrigerator> => {
    const res = await api.post(BASE, payload);
    return res.data.data;
  },

  update: async (id: string, payload: Partial<RefrigeratorInput>): Promise<Refrigerator> => {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: string): Promise<{ id: string }> => {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data.data;
  },

  // --- Pengisian -------------------------------------------------------------

  createFill: async (refrigeratorId: string, payload: FillInput): Promise<RefrigeratorFill> => {
    const res = await api.post(`${BASE}/${refrigeratorId}/fills`, payload);
    return res.data.data;
  },

  getFills: async (
    refrigeratorId: string,
    params: FillListParams = {},
  ): Promise<Paginated<RefrigeratorFill>> => {
    const res = await api.get(`${BASE}/${refrigeratorId}/fills`, { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  deleteFill: async (refrigeratorId: string, fillId: string): Promise<{ id: string }> => {
    const res = await api.delete(`${BASE}/${refrigeratorId}/fills/${fillId}`);
    return res.data.data;
  },

  // --- Rekap pekanan / bagi hasil --------------------------------------------

  recapPreview: async (refrigeratorId: string, from: string, to: string): Promise<RecapPreview> => {
    const res = await api.get(`${BASE}/${refrigeratorId}/recap-preview`, { params: { from, to } });
    return res.data.data;
  },

  createReport: async (refrigeratorId: string, payload: WeeklyReportInput): Promise<WeeklyReport> => {
    const res = await api.post(`${BASE}/${refrigeratorId}/reports`, payload);
    return res.data.data;
  },

  getReports: async (refrigeratorId: string, params: { page?: number; limit?: number } = {}): Promise<Paginated<WeeklyReport>> => {
    const res = await api.get(`${BASE}/${refrigeratorId}/reports`, { params });
    return { data: res.data.data, meta: res.data.meta };
  },

  deleteReport: async (refrigeratorId: string, reportId: string): Promise<{ id: string }> => {
    const res = await api.delete(`${BASE}/${refrigeratorId}/reports/${reportId}`);
    return res.data.data;
  },
};
