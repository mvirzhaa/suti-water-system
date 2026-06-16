// Tipe data fitur Kulkas Suti (frontend).
// Nilai Decimal dari API datang sebagai string (mis. "1505000.00").

export interface TodayFill {
  boxCount: number;
  totalBottles: number;
  totalCost: string;
  fillCount: number;
  lastFillAt: string | null;
}

export interface RefrigeratorShare {
  id: string;
  refrigeratorId: string;
  instansiName: string;
  percentage: string; // Decimal dari API berupa string, mis. "60.00"
  createdAt?: string;
}

export interface Refrigerator {
  id: string;
  name: string;
  location: string | null;
  code: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  profitSharingEnabled: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  todayFill?: TodayFill;
  shares?: RefrigeratorShare[];
}

export interface RefrigeratorFill {
  id: string;
  refrigeratorId: string;
  productId: string | null;
  userId: string;
  fillDate: string;
  boxCount: number;
  bottlesPerBox: number;
  pricePerBox: string;
  pricePerBottle: string;
  totalBottles: number;
  totalCost: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
}

export interface RefrigeratorSummary {
  totalRefrigerators: number;
  filledToday: number;
  notFilledToday: number;
  boxCountToday: number;
  totalBottlesToday: number;
  totalCostToday: string;
  fillCountToday: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- Rekap pekanan / bagi hasil ----------------------------------------------

export interface ReportShare {
  id: string;
  reportId: string;
  instansiName: string;
  percentage: string;
  amount: string;
}

export interface WeeklyReport {
  id: string;
  refrigeratorId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  actualRevenue: string;
  modalCost: string;
  netProfit: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  shares: ReportShare[];
  user?: { id: string; name: string };
}

export interface RecapPreview {
  periodStart: string;
  periodEnd: string;
  modalCost: string;
  boxCount: number;
  totalBottles: number;
  fillCount: number;
}

// --- Payload form ------------------------------------------------------------

export interface ShareInput {
  instansiName: string;
  percentage: number;
}

export interface RefrigeratorInput {
  name: string;
  location?: string | null;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  profitSharingEnabled?: boolean;
  shares?: ShareInput[];
}

export interface WeeklyReportInput {
  periodStart: string;
  periodEnd: string;
  actualRevenue: number;
  notes?: string | null;
}

export interface FillInput {
  fillDate?: string; // YYYY-MM-DD
  productId?: string | null;
  boxCount: number;
  bottlesPerBox?: number;
  pricePerBox: number;
  pricePerBottle: number;
  notes?: string | null;
}
