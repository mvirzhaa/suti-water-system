export type QueryParams = Record<string, string | number | boolean | undefined>;

export type ApiListResponse<T> = {
  data: T[];
  message?: string;
  success?: boolean;
  meta?: unknown;
};

export type Role = 'SUPER_ADMIN' | 'PIMPINAN' | 'STAFF';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
};

export type ProductUnit = 'Kardus' | 'Galon';

export type Product = {
  id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  unit: ProductUnit;
  priceSell: number;
  stock?: number;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
};

export type Agent = {
  id: string;
  name: string;
  pic?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type Discount = {
  id: string;
  isActive: boolean;
  type: string;
  value: number;
};

export type StockInRecord = {
  id: string;
  entryDate: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  notaUrl?: string | null;
  product?: Pick<Product, 'sku' | 'name' | 'unit'>;
  suppl?: Pick<Supplier, 'name'>;
  supplier?: string | null;
};

export type StockOutRecord = {
  id: string;
  exitDate: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  discountAmount: number;
  buyerName?: string | null;
  notes?: string | null;
  notaUrl?: string | null;
  product?: Pick<Product, 'sku' | 'name'>;
  agent?: Pick<Agent, 'name'>;
  discount?: Pick<Discount, 'value'>;
};

export type DashboardSummary = {
  kpi: {
    totalAgen: number;
    totalStok: number;
    totalPendapatan: number;
  };
  topBuyers: Array<{ rank: number; name: string; qty: number; city?: string }>;
  topProducts: Array<{ rank: number; name: string; qty: number; unit: string; img?: string }>;
  chartData: Array<{ name: string; masuk: number; keluar: number }>;
  lowStock: Array<{ name: string; stock: number }>;
  recentStockIn: Array<{ date: string; product: string; qty: number }>;
  recentStockOut: Array<{ date: string; product: string; qty: number }>;
};
