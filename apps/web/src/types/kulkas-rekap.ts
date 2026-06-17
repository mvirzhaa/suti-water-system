// Tipe data fitur Rekap Perhitungan Uang Kulkas Pekanan (frontend).
// Nilai Decimal dari API datang sebagai string (mis. "1505000.00").

export interface RekapLine {
  id: string;
  rekapId: string;
  refrigeratorId: string | null;
  label: string;
  qty500: number;
  qty1000: number;
  qty2000: number;
  qty5000: number;
  qty10000: number;
  qty20000: number;
  qty50000: number;
  qty100000: number;
  cashTotal: string;
  qrisAmount: string;
  sortOrder: number;
}

export interface RekapShare {
  id: string;
  rekapId: string;
  instansiName: string;
  percentage: string;
  amount: string;
  sortOrder: number;
}

export interface KulkasRekap {
  id: string;
  userId: string;
  rekapDate: string;
  title: string | null;
  dusSold: number;
  pricePerDus: string;
  modalCost: string;
  cashTotal: string;
  qrisTotal: string;
  grandTotal: string;
  netProfit: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lines: RekapLine[];
  shares: RekapShare[];
  user?: { id: string; name: string };
  _count?: { lines: number };
}

// --- Payload form ------------------------------------------------------------

export interface RekapLineInput {
  refrigeratorId?: string | null;
  label: string;
  qty500?: number;
  qty1000?: number;
  qty2000?: number;
  qty5000?: number;
  qty10000?: number;
  qty20000?: number;
  qty50000?: number;
  qty100000?: number;
  qrisAmount?: number;
}

export interface RekapShareInput {
  instansiName: string;
  percentage: number;
}

export interface CreateRekapInput {
  rekapDate: string;
  title?: string | null;
  dusSold?: number;
  pricePerDus?: number;
  notes?: string | null;
  lines: RekapLineInput[];
  shares?: RekapShareInput[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
