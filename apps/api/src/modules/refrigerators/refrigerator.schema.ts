import { z } from 'zod';

/**
 * Skema validasi modul Kulkas (Refrigerator).
 *
 * Catatan kontrak `validate(schema, target)` di proyek ini:
 * middleware memvalidasi SATU target ('body' | 'query' | 'params') dan
 * menulis ulang req[target] dengan hasil parse. Karena `req.query` bersifat
 * getter-only di Express 5, skema query di-parse manual di controller
 * (lihat refrigerator.controller.ts), sementara skema body dipakai langsung
 * oleh middleware `validate`.
 */

// Helper: angka uang dari body JSON. Menerima number atau string angka.
const decimalString = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === 'number' ? v : Number(v)))
  .refine((v) => Number.isFinite(v) && v >= 0, {
    message: 'Nilai harus berupa angka >= 0',
  });

const positiveInt = z.coerce
  .number({ error: 'Harus berupa angka' })
  .int('Harus bilangan bulat')
  .positive('Harus lebih besar dari 0');

const nonNegativeInt = z.coerce
  .number({ error: 'Harus berupa angka' })
  .int('Harus bilangan bulat')
  .min(0, 'Tidak boleh negatif');

// --- MASTER KULKAS -----------------------------------------------------------

// Satu baris konfigurasi bagi hasil: instansi + persentase.
export const shareItemSchema = z.object({
  instansiName: z.string().trim().min(1, 'Nama instansi wajib diisi').max(150),
  percentage: z.coerce
    .number({ error: 'Persentase wajib diisi' })
    .min(0.01, 'Persentase harus lebih besar dari 0')
    .max(100, 'Persentase maksimal 100'),
});

const refrigeratorBase = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama kulkas minimal 2 karakter')
    .max(150, 'Nama kulkas maksimal 150 karakter'),
  location: z.string().trim().max(150).optional().nullable(),
  code: z
    .string()
    .trim()
    .max(50)
    .regex(/^[A-Za-z0-9_-]*$/, 'Kode hanya boleh huruf, angka, - dan _')
    .optional()
    .nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  imageUrl: z.string().url('URL gambar tidak valid').optional().nullable(),
  isActive: z.boolean().optional(),
  // Bagi hasil
  profitSharingEnabled: z.boolean().optional(),
  shares: z.array(shareItemSchema).optional(),
});

// Validasi: jika bagi hasil aktif, daftar instansi wajib ada & total persen = 100.
function validateShares(
  data: { profitSharingEnabled?: boolean; shares?: { percentage: number }[] },
  ctx: z.RefinementCtx,
) {
  if (data.profitSharingEnabled !== true) return;
  if (!data.shares || data.shares.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['shares'],
      message: 'Tambahkan minimal satu instansi untuk sistem bagi hasil',
    });
    return;
  }
  const sum = data.shares.reduce((acc, s) => acc + Number(s.percentage), 0);
  if (Math.abs(sum - 100) > 0.01) {
    ctx.addIssue({
      code: 'custom',
      path: ['shares'],
      message: `Total persentase bagi hasil harus 100% (sekarang ${sum}%)`,
    });
  }
}

export const createRefrigeratorSchema = refrigeratorBase.superRefine(validateShares);

// Semua field opsional saat update, minimal satu field harus diisi.
export const updateRefrigeratorSchema = refrigeratorBase.partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({ code: 'custom', message: 'Minimal satu field harus diisi untuk pembaruan' });
  }
  validateShares(data, ctx);
});

// --- PENGISIAN KULKAS (FILL) -------------------------------------------------

export const createFillSchema = z.object({
  // default ke hari ini bila tidak dikirim
  fillDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD')
    .optional(),
  productId: z.string().uuid('ID produk tidak valid').optional().nullable(),
  boxCount: positiveInt, // jumlah kardus
  bottlesPerBox: nonNegativeInt.optional().default(0), // botol per kardus (opsional)
  pricePerBox: decimalString, // harga/modal per kardus
  pricePerBottle: decimalString, // harga jual per botol
  notes: z.string().trim().max(1000).optional().nullable(),
});

// --- QUERY (paginasi + pencarian) — di-parse manual di controller -----------

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  search: z.string().trim().optional(),
  // hanya untuk list master: filter status aktif
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const fillListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// --- REKAP PEKANAN / BAGI HASIL ---------------------------------------------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD');

export const createWeeklyReportSchema = z
  .object({
    periodStart: isoDate,
    periodEnd: isoDate,
    actualRevenue: decimalString, // uang masuk aktual pekan ini (input manual)
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((d) => new Date(d.periodEnd) >= new Date(d.periodStart), {
    path: ['periodEnd'],
    message: 'Tanggal akhir tidak boleh sebelum tanggal mulai',
  });

export const recapPreviewQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
});

export const reportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

// Tipe turunan untuk dipakai di service / frontend
export type RefrigeratorBody = z.infer<typeof createRefrigeratorSchema>;
export type FillBody = z.infer<typeof createFillSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type FillListQuery = z.infer<typeof fillListQuerySchema>;
export type WeeklyReportBody = z.infer<typeof createWeeklyReportSchema>;
export type RecapPreviewQuery = z.infer<typeof recapPreviewQuerySchema>;
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;
