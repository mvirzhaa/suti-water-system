import { z } from 'zod';

/**
 * Skema validasi modul Rekap Perhitungan Uang Kulkas Pekanan.
 * Satu rekap = satu "lembar" berisi banyak baris kulkas (dengan rincian pecahan)
 * + konfigurasi bagi hasil. Body berupa JSON biasa (bukan multipart).
 */

const nonNegInt = z.coerce
  .number({ error: 'Harus berupa angka' })
  .int('Harus bilangan bulat')
  .min(0, 'Tidak boleh negatif');

// Angka uang: terima number atau string angka, harus >= 0.
const money = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === 'number' ? v : Number(v)))
  .refine((v) => Number.isFinite(v) && v >= 0, { message: 'Nilai harus berupa angka >= 0' });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD');

// Satu baris kulkas: rincian lembar per pecahan + QRIS.
export const rekapLineSchema = z.object({
  refrigeratorId: z.string().uuid('ID kulkas tidak valid').optional().nullable(),
  label: z.string().trim().min(1, 'Nama kulkas/lokasi wajib diisi').max(150),
  qty500: nonNegInt.optional().default(0),
  qty1000: nonNegInt.optional().default(0),
  qty2000: nonNegInt.optional().default(0),
  qty5000: nonNegInt.optional().default(0),
  qty10000: nonNegInt.optional().default(0),
  qty20000: nonNegInt.optional().default(0),
  qty50000: nonNegInt.optional().default(0),
  qty100000: nonNegInt.optional().default(0),
  qrisAmount: money.optional().default(0),
});

// Satu baris bagi hasil: instansi + persentase.
export const shareItemSchema = z.object({
  instansiName: z.string().trim().min(1, 'Nama instansi wajib diisi').max(150),
  percentage: z.coerce
    .number({ error: 'Persentase wajib diisi' })
    .min(0.01, 'Persentase harus lebih besar dari 0')
    .max(100, 'Persentase maksimal 100'),
});

export const createRekapSchema = z
  .object({
    rekapDate: isoDate,
    title: z.string().trim().max(150).optional().nullable(),
    dusSold: nonNegInt.optional().default(0),
    pricePerDus: money.optional().default(0),
    notes: z.string().trim().max(1000).optional().nullable(),
    lines: z.array(rekapLineSchema).min(1, 'Minimal satu kulkas harus diisi'),
    shares: z.array(shareItemSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // Jika bagi hasil diisi, total persentase harus 100%.
    if (data.shares && data.shares.length > 0) {
      const sum = data.shares.reduce((acc, s) => acc + Number(s.percentage), 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: 'custom',
          path: ['shares'],
          message: `Total persentase bagi hasil harus 100% (sekarang ${sum}%)`,
        });
      }
    }
  });

export const rekapListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type CreateRekapBody = z.infer<typeof createRekapSchema>;
export type RekapLineBody = z.infer<typeof rekapLineSchema>;
export type RekapListQuery = z.infer<typeof rekapListQuerySchema>;
