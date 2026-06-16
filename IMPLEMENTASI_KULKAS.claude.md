# TASK CLAUDE CODE — Implementasi Fitur "Kulkas Suti"

Kamu adalah senior programmer yang mengintegrasikan satu fitur baru ke dalam repo
**Suti Water System** (Turborepo monorepo: `apps/api` Express+Prisma, `apps/web`
Next.js 16 App Router, `prisma/`). Semua kode & komentar dalam Bahasa Indonesia.

Fitur: item sidebar **"Kulkas"** → halaman kartu per kulkas, tombol **Tambah Kulkas**,
tiap kartu menampilkan **"hari ini sudah terisi"** (kardus + total nilai), dan **form
pengisian harian** (jumlah kardus, harga/kardus, harga/botol).

---

## ATURAN EKSEKUSI (baca dulu, lalu kerjakan berurutan)

1. **Baca seluruh file ini sampai habis sebelum menulis apa pun.**
2. **Deteksi konvensi repo yang sebenarnya dulu**, jangan asumsi buta:
   - Lokasi `prisma/schema.prisma`.
   - File pendaftaran route Express (cari pemanggilan `app.use('/api...` atau `router.use(...)`,
     biasanya `apps/api/src/routes/index.ts` atau `apps/api/src/app.ts`).
   - Komponen/konfigurasi navigasi sidebar (cari array `navItems`/`menu` atau file
     `sidebar.tsx` di `apps/web/src`).
   - Util pendukung yang **diasumsikan** kode ini: `prisma` (`config/prisma`),
     `ApiError` (`utils/ApiError`), `createAuditLog` (`utils/auditLog`),
     `asyncHandler` (`utils/asyncHandler`), middleware `verifyJWT`/`authorize`/`validate`
     (`middlewares/*`), instance axios `api` (`@/services/api`), `useAuthStore` (`@/store/auth`).
   - **Jika nama/path util di repo berbeda, sesuaikan baris `import`-nya** — jangan
     mengubah logika. Kalau suatu util benar-benar belum ada, buat versi minimal
     (lihat `asyncHandler` di Langkah 6).
3. Untuk file yang ditandai **MERGE**, jangan menimpa file yang sudah ada — tambahkan
   hanya bagian yang belum ada.
4. Jangan menjalankan migrasi/`npm install` secara diam-diam di tengah; kumpulkan di
   Langkah akhir. Setelah selesai, laporkan ringkas apa yang dibuat/diubah dan path util
   yang kamu sesuaikan.
5. Jangan menyentuh modul lain di luar yang disebut task ini.

---

## LANGKAH 1 — Prisma schema

### 1a. Tambahkan dua model baru ke `prisma/schema.prisma`
Tempelkan blok berikut (bagian "MODEL BARU") ke akhir `prisma/schema.prisma`:

```prisma
// =============================================================================
//  TAMBAHAN SCHEMA UNTUK FITUR "KULKAS SUTI"
//  Gabungkan blok-blok di bawah ini ke dalam prisma/schema.prisma yang sudah ada,
//  lalu jalankan:  npx prisma migrate dev --name add_refrigerators
// =============================================================================

// -----------------------------------------------------------------------------
// 1) MODEL BARU
// -----------------------------------------------------------------------------

/// Master data kulkas (satu record = satu "kartu" di halaman Kulkas).
/// Contoh: "Kulkas Masjid", "Kulkas Teknik", "Kulkas FIKES", dst.
model Refrigerator {
  id          String    @id @default(uuid())
  name        String    @db.VarChar(150) // Nama kulkas yang tampil di kartu
  location    String?   @db.VarChar(150) // Lokasi/fakultas, mis. "Fakultas Teknik"
  code        String?   @unique @db.VarChar(50) // Kode pendek opsional (mis. "TEK", "MSJ")
  description String?
  imageUrl    String?   @map("image_url")
  isActive    Boolean   @default(true) @map("is_active")
  createdBy   String?   @map("created_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at") // Soft delete — mengikuti pola tabel products

  creator User?              @relation("RefrigeratorCreatedBy", fields: [createdBy], references: [id])
  fills   RefrigeratorFill[]

  @@index([isActive])
  @@index([name])
  @@map("refrigerators")
}

/// Transaksi pengisian kulkas harian ("barang keluar buat kulkas").
/// Satu record = satu kali isi kulkas pada tanggal tertentu.
model RefrigeratorFill {
  id             String   @id @default(uuid())
  refrigeratorId String   @map("refrigerator_id")
  productId      String?  @map("product_id") // Opsional: tautan ke katalog produk (untuk integrasi stok FIFO ke depan)
  userId         String   @map("user_id")
  fillDate       DateTime @map("fill_date") @db.Date

  boxCount       Int     @map("box_count") // Jumlah kardus yang diisi
  bottlesPerBox  Int     @default(0) @map("bottles_per_box") // Botol per kardus (untuk rekonsiliasi; 0 = tidak dipakai)
  pricePerBox    Decimal @map("price_per_box") @db.Decimal(12, 2) // Harga/modal per kardus
  pricePerBottle Decimal @map("price_per_bottle") @db.Decimal(12, 2) // Harga jual per botol

  // Kolom turunan (dihitung di service, disimpan agar laporan cepat & konsisten)
  totalBottles Int     @default(0) @map("total_bottles") // boxCount * bottlesPerBox
  totalCost    Decimal @map("total_cost") @db.Decimal(14, 2) // boxCount * pricePerBox (nilai modal terisi)

  notes     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  refrigerator Refrigerator @relation(fields: [refrigeratorId], references: [id])
  product      Product?     @relation(fields: [productId], references: [id])
  user         User         @relation(fields: [userId], references: [id])

  @@index([refrigeratorId])
  @@index([productId])
  @@index([fillDate(sort: Desc)])
  @@map("refrigerator_fills")
}

// -----------------------------------------------------------------------------
// 2) TAMBAHKAN RELASI BALIK PADA MODEL YANG SUDAH ADA
//    (jangan buat model baru — cukup sisipkan baris berikut ke dalam model terkait)
// -----------------------------------------------------------------------------

// >>> di dalam model User { ... } tambahkan:
//   refrigeratorsCreated Refrigerator[]     @relation("RefrigeratorCreatedBy")
//   refrigeratorFills    RefrigeratorFill[]

// >>> di dalam model Product { ... } tambahkan:
//   refrigeratorFills RefrigeratorFill[]
```

### 1b. Tambahkan relasi balik pada model yang sudah ada
Di dalam `model User { ... }` tambahkan dua baris:

```prisma
  refrigeratorsCreated Refrigerator[]     @relation("RefrigeratorCreatedBy")
  refrigeratorFills    RefrigeratorFill[]
```

Di dalam `model Product { ... }` tambahkan satu baris:

```prisma
  refrigeratorFills RefrigeratorFill[]
```

(Komentar petunjuk yang sama juga ada di bagian bawah blok schema di atas — jangan
sampai membuat model `User`/`Product` baru; cukup sisipkan baris relasi ke model
yang sudah ada.)

---

## LANGKAH 2 — Backend (modul `refrigerators`)

Buat keempat file berikut **persis** seperti isinya. Folder:
`apps/api/src/modules/refrigerators/`.


#### `apps/api/src/modules/refrigerators/refrigerator.schema.ts`

```ts
import { z } from 'zod';

/**
 * Skema validasi modul Kulkas (Refrigerator).
 *
 * Catatan kontrak `validate(zodSchema)`:
 * Middleware `validate` di proyek ini memeriksa `body`, `query`, dan `params`.
 * Karena itu setiap skema dibungkus dalam objek { body, query, params }.
 * Skema "field" (mis. `refrigeratorBodySchema`) diekspor terpisah agar bisa
 * dipakai ulang di frontend (React Hook Form + Zod).
 */

// Helper: angka uang dari body JSON. Menerima number atau string angka.
const decimalString = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === 'number' ? v : Number(v)))
  .refine((v) => Number.isFinite(v) && v >= 0, {
    message: 'Nilai harus berupa angka >= 0',
  });

const positiveInt = z
  .number({ invalid_type_error: 'Harus berupa angka' })
  .int('Harus bilangan bulat')
  .positive('Harus lebih besar dari 0');

const nonNegativeInt = z
  .number({ invalid_type_error: 'Harus berupa angka' })
  .int('Harus bilangan bulat')
  .min(0, 'Tidak boleh negatif');

// --- MASTER KULKAS -----------------------------------------------------------

export const refrigeratorBodySchema = z.object({
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
});

export const createRefrigeratorSchema = z.object({
  body: refrigeratorBodySchema,
});

export const updateRefrigeratorSchema = z.object({
  params: z.object({ id: z.string().uuid('ID kulkas tidak valid') }),
  // semua field opsional saat update
  body: refrigeratorBodySchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Minimal satu field harus diisi untuk pembaruan' },
  ),
});

export const refrigeratorIdSchema = z.object({
  params: z.object({ id: z.string().uuid('ID kulkas tidak valid') }),
});

// --- PENGISIAN KULKAS (FILL) -------------------------------------------------

export const fillBodySchema = z.object({
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

export const createFillSchema = z.object({
  params: z.object({ id: z.string().uuid('ID kulkas tidak valid') }),
  body: fillBodySchema,
});

export const deleteFillSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID kulkas tidak valid'),
    fillId: z.string().uuid('ID pengisian tidak valid'),
  }),
});

// --- QUERY (paginasi + pencarian) -------------------------------------------

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(12),
    search: z.string().trim().optional(),
    // hanya untuk list master: filter status aktif
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  }),
});

export const fillListQuerySchema = z.object({
  params: z.object({ id: z.string().uuid('ID kulkas tidak valid') }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

// Tipe turunan untuk dipakai di service / frontend
export type RefrigeratorBody = z.infer<typeof refrigeratorBodySchema>;
export type FillBody = z.infer<typeof fillBodySchema>;
```


#### `apps/api/src/modules/refrigerators/refrigerator.service.ts`

> Catatan: flag `INTEGRATE_WAREHOUSE_STOCK` di dalam file ini sengaja `false`. Jangan diubah kecuali satuan stok (botol vs kardus) sudah konsisten.

```ts
import { Prisma } from '@prisma/client';

// NOTE: sesuaikan path import berikut dengan struktur util Anda bila berbeda.
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { createAuditLog } from '../../utils/auditLog';

import type { RefrigeratorBody, FillBody } from './refrigerator.schema';

/**
 * Flag integrasi stok gudang.
 * - false (default): pengisian kulkas TIDAK mengurangi stok Product.
 *   Cocok bila katalog produk belum menstandarkan unit (kardus vs botol).
 * - true: pengisian kulkas mengurangi stok Product memakai FIFO yang sama
 *   dengan modul stock-out. Aktifkan hanya bila `productId` dikirim dan unit
 *   produk sudah konsisten (lihat blok depleteProductStockFIFO di bawah).
 */
const INTEGRATE_WAREHOUSE_STOCK = false;

type Paging = { page: number; limit: number };

// ---------------------------------------------------------------------------
//  MASTER KULKAS
// ---------------------------------------------------------------------------

export interface ListRefrigeratorParams extends Paging {
  search?: string;
  isActive?: boolean;
}

/**
 * Daftar kulkas + ringkasan "terisi hari ini" untuk setiap kartu.
 * Agregasi hari ini dihitung dengan satu query group-by agar tidak N+1.
 */
export async function listRefrigerators(params: ListRefrigeratorParams) {
  const { page, limit, search, isActive } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.RefrigeratorWhereInput = {
    deletedAt: null,
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.refrigerator.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.refrigerator.count({ where }),
  ]);

  // Agregasi pengisian HARI INI untuk seluruh kulkas pada halaman ini.
  const ids = items.map((r) => r.id);
  const { start, end } = dayRange(new Date());

  const todayAgg = ids.length
    ? await prisma.refrigeratorFill.groupBy({
        by: ['refrigeratorId'],
        where: { refrigeratorId: { in: ids }, fillDate: { gte: start, lte: end } },
        _sum: { boxCount: true, totalBottles: true, totalCost: true },
        _count: { _all: true },
        _max: { createdAt: true },
      })
    : [];

  const aggMap = new Map(todayAgg.map((a) => [a.refrigeratorId, a]));

  const data = items.map((r) => {
    const agg = aggMap.get(r.id);
    return {
      ...r,
      todayFill: {
        boxCount: agg?._sum.boxCount ?? 0,
        totalBottles: agg?._sum.totalBottles ?? 0,
        totalCost: (agg?._sum.totalCost ?? new Prisma.Decimal(0)).toString(),
        fillCount: agg?._count._all ?? 0,
        lastFillAt: agg?._max.createdAt ?? null,
      },
    };
  });

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getRefrigeratorById(id: string) {
  const fridge = await prisma.refrigerator.findFirst({
    where: { id, deletedAt: null },
    include: {
      fills: {
        orderBy: { fillDate: 'desc' },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!fridge) throw new ApiError(404, 'Kulkas tidak ditemukan', 'NOT_FOUND');
  return fridge;
}

export async function createRefrigerator(
  body: RefrigeratorBody,
  userId: string,
  audit?: { ipAddress?: string; userAgent?: string },
) {
  if (body.code) {
    const exists = await prisma.refrigerator.findFirst({
      where: { code: body.code, deletedAt: null },
    });
    if (exists) throw new ApiError(409, 'Kode kulkas sudah dipakai', 'DUPLICATE_CODE');
  }

  const created = await prisma.refrigerator.create({
    data: {
      name: body.name,
      location: body.location ?? null,
      code: body.code ?? null,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      isActive: body.isActive ?? true,
      createdBy: userId,
    },
  });

  void createAuditLog({
    userId,
    action: 'CREATE',
    entity: 'Refrigerator',
    entityId: created.id,
    newValue: created,
    ...audit,
  });

  return created;
}

export async function updateRefrigerator(
  id: string,
  body: Partial<RefrigeratorBody>,
  userId: string,
  audit?: { ipAddress?: string; userAgent?: string },
) {
  const existing = await prisma.refrigerator.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new ApiError(404, 'Kulkas tidak ditemukan', 'NOT_FOUND');

  if (body.code && body.code !== existing.code) {
    const dup = await prisma.refrigerator.findFirst({
      where: { code: body.code, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new ApiError(409, 'Kode kulkas sudah dipakai', 'DUPLICATE_CODE');
  }

  const updated = await prisma.refrigerator.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  });

  void createAuditLog({
    userId,
    action: 'UPDATE',
    entity: 'Refrigerator',
    entityId: id,
    oldValue: existing,
    newValue: updated,
    ...audit,
  });

  return updated;
}

/** Soft delete — konsisten dengan pola products/discounts. */
export async function deleteRefrigerator(
  id: string,
  userId: string,
  audit?: { ipAddress?: string; userAgent?: string },
) {
  const existing = await prisma.refrigerator.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new ApiError(404, 'Kulkas tidak ditemukan', 'NOT_FOUND');

  await prisma.refrigerator.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  void createAuditLog({
    userId,
    action: 'DELETE',
    entity: 'Refrigerator',
    entityId: id,
    oldValue: existing,
    ...audit,
  });

  return { id };
}

// ---------------------------------------------------------------------------
//  PENGISIAN KULKAS (FILL)
// ---------------------------------------------------------------------------

export async function createFill(
  refrigeratorId: string,
  body: FillBody,
  userId: string,
  audit?: { ipAddress?: string; userAgent?: string },
) {
  const fridge = await prisma.refrigerator.findFirst({
    where: { id: refrigeratorId, deletedAt: null },
  });
  if (!fridge) throw new ApiError(404, 'Kulkas tidak ditemukan', 'NOT_FOUND');

  const bottlesPerBox = body.bottlesPerBox ?? 0;
  const totalBottles = body.boxCount * bottlesPerBox;

  // Kalkulasi uang memakai Prisma.Decimal agar bebas masalah floating-point.
  const pricePerBox = new Prisma.Decimal(body.pricePerBox);
  const pricePerBottle = new Prisma.Decimal(body.pricePerBottle);
  const totalCost = pricePerBox.mul(body.boxCount); // nilai modal terisi

  const fillDate = body.fillDate ? new Date(body.fillDate) : startOfDay(new Date());

  const fill = await prisma.$transaction(async (tx) => {
    const created = await tx.refrigeratorFill.create({
      data: {
        refrigeratorId,
        productId: body.productId ?? null,
        userId,
        fillDate,
        boxCount: body.boxCount,
        bottlesPerBox,
        pricePerBox,
        pricePerBottle,
        totalBottles,
        totalCost,
        notes: body.notes ?? null,
      },
    });

    // ===== OPSIONAL: integrasi stok gudang (FIFO) ============================
    // Aktif hanya jika INTEGRATE_WAREHOUSE_STOCK=true DAN productId dikirim.
    // Mengikuti algoritma FIFO yang sama dengan modul stock-out.
    if (INTEGRATE_WAREHOUSE_STOCK && body.productId && totalBottles > 0) {
      await depleteProductStockFIFO(tx, body.productId, totalBottles);
    }
    // =========================================================================

    return created;
  });

  void createAuditLog({
    userId,
    action: 'FILL',
    entity: 'RefrigeratorFill',
    entityId: fill.id,
    newValue: fill,
    metadata: { refrigeratorId, refrigeratorName: fridge.name },
    ...audit,
  });

  return fill;
}

export async function listFills(
  refrigeratorId: string,
  query: Paging & { from?: string; to?: string },
) {
  const fridge = await prisma.refrigerator.findFirst({
    where: { id: refrigeratorId, deletedAt: null },
  });
  if (!fridge) throw new ApiError(404, 'Kulkas tidak ditemukan', 'NOT_FOUND');

  const { page, limit, from, to } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.RefrigeratorFillWhereInput = {
    refrigeratorId,
    ...(from || to
      ? {
          fillDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.refrigeratorFill.findMany({
      where,
      orderBy: [{ fillDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.refrigeratorFill.count({ where }),
  ]);

  return {
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/** Hapus 1 pengisian (hanya SUPER_ADMIN/PIMPINAN — diatur di routes). */
export async function deleteFill(
  refrigeratorId: string,
  fillId: string,
  userId: string,
  audit?: { ipAddress?: string; userAgent?: string },
) {
  const fill = await prisma.refrigeratorFill.findFirst({
    where: { id: fillId, refrigeratorId },
  });
  if (!fill) throw new ApiError(404, 'Data pengisian tidak ditemukan', 'NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    // Jika integrasi stok aktif & dahulu memotong stok, kembalikan di sini (LIFO).
    if (INTEGRATE_WAREHOUSE_STOCK && fill.productId && fill.totalBottles > 0) {
      await restoreProductStockLIFO(tx, fill.productId, fill.totalBottles);
    }
    await tx.refrigeratorFill.delete({ where: { id: fillId } });
  });

  void createAuditLog({
    userId,
    action: 'DELETE',
    entity: 'RefrigeratorFill',
    entityId: fillId,
    oldValue: fill,
    ...audit,
  });

  return { id: fillId };
}

// ---------------------------------------------------------------------------
//  RINGKASAN (untuk header halaman)
// ---------------------------------------------------------------------------

export async function getTodaySummary() {
  const { start, end } = dayRange(new Date());

  const [totalRefrigerators, agg] = await prisma.$transaction([
    prisma.refrigerator.count({ where: { deletedAt: null, isActive: true } }),
    prisma.refrigeratorFill.aggregate({
      where: { fillDate: { gte: start, lte: end } },
      _sum: { boxCount: true, totalBottles: true, totalCost: true },
      _count: { _all: true },
    }),
  ]);

  const filledFridges = await prisma.refrigeratorFill.findMany({
    where: { fillDate: { gte: start, lte: end } },
    distinct: ['refrigeratorId'],
    select: { refrigeratorId: true },
  });

  return {
    totalRefrigerators,
    filledToday: filledFridges.length,
    notFilledToday: Math.max(totalRefrigerators - filledFridges.length, 0),
    boxCountToday: agg._sum.boxCount ?? 0,
    totalBottlesToday: agg._sum.totalBottles ?? 0,
    totalCostToday: (agg._sum.totalCost ?? new Prisma.Decimal(0)).toString(),
    fillCountToday: agg._count._all ?? 0,
  };
}

// ---------------------------------------------------------------------------
//  HELPER INTERNAL
// ---------------------------------------------------------------------------

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayRange(d: Date) {
  const start = startOfDay(d);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Pengurangan stok FIFO — SALINAN pola dari stock-out.service.ts.
 * Dipakai hanya bila INTEGRATE_WAREHOUSE_STOCK=true.
 * NOTE: pastikan satuan `quantity` (botol) konsisten dengan Product.stock Anda.
 */
async function depleteProductStockFIFO(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
) {
  const product = await tx.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw new ApiError(404, 'Produk tidak ditemukan', 'NOT_FOUND');
  if (product.stock < quantity) {
    throw new ApiError(422, 'Stok gudang tidak mencukupi untuk pengisian ini', 'INSUFFICIENT_STOCK');
  }

  let qtyToDeplete = quantity;
  const availableStockIns = await tx.stockIn.findMany({
    where: { productId, remainingStock: { gt: 0 } },
    orderBy: { entryDate: 'asc' },
  });

  for (const stIn of availableStockIns) {
    if (qtyToDeplete <= 0) break;
    const depleteAmount = Math.min(qtyToDeplete, stIn.remainingStock);
    await tx.stockIn.update({
      where: { id: stIn.id },
      data: { remainingStock: stIn.remainingStock - depleteAmount },
    });
    qtyToDeplete -= depleteAmount;
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });
}

/** Pemulihan stok LIFO saat pengisian dihapus (cermin stock-out rollback). */
async function restoreProductStockLIFO(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
) {
  let qtyToRestore = quantity;
  const recentStockIns = await tx.stockIn.findMany({
    where: { productId },
    orderBy: { entryDate: 'desc' },
  });

  for (const stIn of recentStockIns) {
    if (qtyToRestore <= 0) break;
    const spaceLeft = stIn.quantity - stIn.remainingStock;
    if (spaceLeft > 0) {
      const restoreAmount = Math.min(qtyToRestore, spaceLeft);
      await tx.stockIn.update({
        where: { id: stIn.id },
        data: { remainingStock: stIn.remainingStock + restoreAmount },
      });
      qtyToRestore -= restoreAmount;
    }
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } },
  });
}
```


#### `apps/api/src/modules/refrigerators/refrigerator.controller.ts`

```ts
import type { Request, Response } from 'express';

// `asyncHandler` membungkus handler async agar error otomatis diteruskan ke
// error-handler middleware. Bila proyek Anda belum punya, definisinya sangat
// singkat (lihat README_KULKAS.md bagian "Util pendukung").
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './refrigerator.service';

// Ambil konteks audit dari request (IP + user agent), seragam untuk semua aksi.
const auditCtx = (req: Request) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') ?? undefined,
});

// req.user diisi oleh middleware verifyJWT (lihat §4.2 dokumen).
const uid = (req: Request) => (req.user as { id: string }).id;

// --- MASTER KULKAS -----------------------------------------------------------

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, isActive } = req.query as any;
  const result = await service.listRefrigerators({ page, limit, search, isActive });
  res.status(200).json({
    success: true,
    message: 'Daftar kulkas berhasil diambil',
    data: result.data,
    meta: result.meta,
  });
});

export const summary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.getTodaySummary();
  res.status(200).json({ success: true, message: 'Ringkasan kulkas hari ini', data });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getRefrigeratorById(req.params.id);
  res.status(200).json({ success: true, message: 'Detail kulkas berhasil diambil', data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createRefrigerator(req.body, uid(req), auditCtx(req));
  res.status(201).json({ success: true, message: 'Kulkas berhasil ditambahkan', data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateRefrigerator(req.params.id, req.body, uid(req), auditCtx(req));
  res.status(200).json({ success: true, message: 'Kulkas berhasil diperbarui', data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.deleteRefrigerator(req.params.id, uid(req), auditCtx(req));
  res.status(200).json({ success: true, message: 'Kulkas berhasil dihapus', data });
});

// --- PENGISIAN (FILL) --------------------------------------------------------

export const createFill = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createFill(req.params.id, req.body, uid(req), auditCtx(req));
  res.status(201).json({ success: true, message: 'Pengisian kulkas berhasil dicatat', data });
});

export const listFills = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, from, to } = req.query as any;
  const result = await service.listFills(req.params.id, { page, limit, from, to });
  res.status(200).json({
    success: true,
    message: 'Riwayat pengisian berhasil diambil',
    data: result.data,
    meta: result.meta,
  });
});

export const removeFill = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.deleteFill(req.params.id, req.params.fillId, uid(req), auditCtx(req));
  res.status(200).json({ success: true, message: 'Data pengisian berhasil dihapus', data });
});
```


#### `apps/api/src/modules/refrigerators/refrigerator.routes.ts`

```ts
import { Router } from 'express';

// Middleware keamanan & validasi — sesuaikan path bila berbeda di proyek Anda.
import { verifyJWT } from '../../middlewares/auth';
import { authorize } from '../../middlewares/role';
import { validate } from '../../middlewares/validate';

import * as controller from './refrigerator.controller';
import {
  createRefrigeratorSchema,
  updateRefrigeratorSchema,
  refrigeratorIdSchema,
  listQuerySchema,
  createFillSchema,
  fillListQuerySchema,
  deleteFillSchema,
} from './refrigerator.schema';

const router = Router();

// Semua endpoint kulkas wajib login.
router.use(verifyJWT);

// --- Ringkasan & daftar ------------------------------------------------------
router.get('/summary', controller.summary);
router.get('/', validate(listQuerySchema), controller.list);

// --- Master kulkas -----------------------------------------------------------
// Membuat & memperbarui kulkas boleh oleh semua role (operasional harian).
router.post('/', validate(createRefrigeratorSchema), controller.create);
router.put('/:id', validate(updateRefrigeratorSchema), controller.update);

// Hapus kulkas dibatasi (mengikuti pola "DELETE = Pimpinan/Admin only").
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'PIMPINAN'),
  validate(refrigeratorIdSchema),
  controller.remove,
);

router.get('/:id', validate(refrigeratorIdSchema), controller.detail);

// --- Pengisian (fill) --------------------------------------------------------
router.post('/:id/fills', validate(createFillSchema), controller.createFill);
router.get('/:id/fills', validate(fillListQuerySchema), controller.listFills);
router.delete(
  '/:id/fills/:fillId',
  authorize('SUPER_ADMIN', 'PIMPINAN'),
  validate(deleteFillSchema),
  controller.removeFill,
);

export default router;
```

### 2e. Daftarkan route ke aplikasi Express
Di file pendaftaran route utama (tempat route lain di-`use`), tambahkan import dan
mount-nya. Sesuaikan prefix dengan pola yang sudah ada (mis. jika modul lain dipasang
di `/api/v1`, ikuti itu):

```ts
import refrigeratorRoutes from '../modules/refrigerators/refrigerator.routes';
// ... lalu di tempat route lain didaftarkan:
router.use('/refrigerators', refrigeratorRoutes);
```

---

## LANGKAH 3 — Frontend (Next.js)

Buat file-file berikut di `apps/web/src/`. Perhatikan tanda **MERGE** pada `format.ts`
dan `use-debounce.ts`.


#### `apps/web/src/types/refrigerator.ts`

```ts
// Tipe data fitur Kulkas Suti (frontend).
// Nilai Decimal dari API datang sebagai string (mis. "1505000.00").

export interface TodayFill {
  boxCount: number;
  totalBottles: number;
  totalCost: string;
  fillCount: number;
  lastFillAt: string | null;
}

export interface Refrigerator {
  id: string;
  name: string;
  location: string | null;
  code: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  todayFill?: TodayFill;
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

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

// --- Payload form ------------------------------------------------------------

export interface RefrigeratorInput {
  name: string;
  location?: string | null;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
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
```


#### `apps/web/src/lib/format.ts`

> **MERGE, jangan timpa.** Jika file ini sudah ada, tambahkan hanya export yang belum ada (`formatRupiah`, `formatNumber`, `formatDate`, `formatDateTime`, `todayISO`). Jika belum ada, buat baru dengan isi di bawah.

```ts
// Helper format ringan. Jika proyek Anda sudah punya util serupa,
// pakai milik Anda dan hapus file ini.

export function formatRupiah(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (!Number.isFinite(n)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n as number);
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  return new Intl.NumberFormat('id-ID').format(Number.isFinite(n) ? (n as number) : 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/** YYYY-MM-DD untuk default input tanggal. */
export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
```


#### `apps/web/src/services/refrigerator.service.ts`

> Memakai instance axios milik Anda dari `@/services/api`. Jika path berbeda, sesuaikan importnya.

```ts
// Wrapper HTTP untuk modul Kulkas.
// PENTING: impor instance axios milik Anda yang SUDAH memuat interceptor
// refresh-token (lihat §4.1 dokumen). Sesuaikan path di bawah bila berbeda.
import { api } from '@/services/api';

import type {
  Refrigerator,
  RefrigeratorFill,
  RefrigeratorSummary,
  RefrigeratorInput,
  FillInput,
  Paginated,
} from '@/types/refrigerator';

const BASE = '/refrigerators';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export async function fetchRefrigerators(
  params: ListParams = {},
): Promise<Paginated<Refrigerator>> {
  const res = await api.get(BASE, { params });
  return { data: res.data.data, meta: res.data.meta };
}

export async function fetchSummary(): Promise<RefrigeratorSummary> {
  const res = await api.get(`${BASE}/summary`);
  return res.data.data;
}

export async function fetchRefrigerator(id: string): Promise<Refrigerator> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

export async function createRefrigerator(payload: RefrigeratorInput): Promise<Refrigerator> {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

export async function updateRefrigerator(
  id: string,
  payload: Partial<RefrigeratorInput>,
): Promise<Refrigerator> {
  const res = await api.put(`${BASE}/${id}`, payload);
  return res.data.data;
}

export async function deleteRefrigerator(id: string): Promise<{ id: string }> {
  const res = await api.delete(`${BASE}/${id}`);
  return res.data.data;
}

// --- Pengisian ---------------------------------------------------------------

export interface FillListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export async function createFill(
  refrigeratorId: string,
  payload: FillInput,
): Promise<RefrigeratorFill> {
  const res = await api.post(`${BASE}/${refrigeratorId}/fills`, payload);
  return res.data.data;
}

export async function fetchFills(
  refrigeratorId: string,
  params: FillListParams = {},
): Promise<Paginated<RefrigeratorFill>> {
  const res = await api.get(`${BASE}/${refrigeratorId}/fills`, { params });
  return { data: res.data.data, meta: res.data.meta };
}

export async function deleteFill(
  refrigeratorId: string,
  fillId: string,
): Promise<{ id: string }> {
  const res = await api.delete(`${BASE}/${refrigeratorId}/fills/${fillId}`);
  return res.data.data;
}
```


#### `apps/web/src/hooks/use-refrigerators.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as svc from '@/services/refrigerator.service';
import type { RefrigeratorInput, FillInput } from '@/types/refrigerator';

export const refrigeratorKeys = {
  all: ['refrigerators'] as const,
  list: (params: svc.ListParams) => ['refrigerators', 'list', params] as const,
  summary: () => ['refrigerators', 'summary'] as const,
  detail: (id: string) => ['refrigerators', 'detail', id] as const,
  fills: (id: string, params: svc.FillListParams) =>
    ['refrigerators', id, 'fills', params] as const,
};

// --- Queries -----------------------------------------------------------------

export function useRefrigerators(params: svc.ListParams = {}) {
  return useQuery({
    queryKey: refrigeratorKeys.list(params),
    queryFn: () => svc.fetchRefrigerators(params),
    placeholderData: (prev) => prev, // keepPreviousData (v5)
  });
}

export function useRefrigeratorSummary() {
  return useQuery({
    queryKey: refrigeratorKeys.summary(),
    queryFn: svc.fetchSummary,
  });
}

export function useRefrigeratorFills(id: string, params: svc.FillListParams = {}, enabled = true) {
  return useQuery({
    queryKey: refrigeratorKeys.fills(id, params),
    queryFn: () => svc.fetchFills(id, params),
    enabled: enabled && !!id,
  });
}

// --- Mutations ---------------------------------------------------------------

function useInvalidateRefrigerators() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: refrigeratorKeys.all });
}

export function useCreateRefrigerator() {
  const invalidate = useInvalidateRefrigerators();
  return useMutation({
    mutationFn: (payload: RefrigeratorInput) => svc.createRefrigerator(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateRefrigerator() {
  const invalidate = useInvalidateRefrigerators();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RefrigeratorInput> }) =>
      svc.updateRefrigerator(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteRefrigerator() {
  const invalidate = useInvalidateRefrigerators();
  return useMutation({
    mutationFn: (id: string) => svc.deleteRefrigerator(id),
    onSuccess: invalidate,
  });
}

export function useCreateFill() {
  const invalidate = useInvalidateRefrigerators();
  return useMutation({
    mutationFn: ({ refrigeratorId, payload }: { refrigeratorId: string; payload: FillInput }) =>
      svc.createFill(refrigeratorId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteFill() {
  const invalidate = useInvalidateRefrigerators();
  return useMutation({
    mutationFn: ({ refrigeratorId, fillId }: { refrigeratorId: string; fillId: string }) =>
      svc.deleteFill(refrigeratorId, fillId),
    onSuccess: invalidate,
  });
}
```


#### `apps/web/src/hooks/use-debounce.ts`

> Buat hanya jika belum ada hook serupa. Jika sudah ada `useDebounce`, lewati file ini dan sesuaikan import di `refrigerators-view.tsx`.

```ts
'use client';

import { useEffect, useState } from 'react';

/** Mengembalikan nilai yang ditunda `delay` ms setelah perubahan terakhir. */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
```


#### `apps/web/src/app/dashboard/refrigerators/page.tsx`

```tsx
import type { Metadata } from 'next';

import { RefrigeratorsView } from '@/components/refrigerators/refrigerators-view';

export const metadata: Metadata = {
  title: 'Kulkas Suti',
  description: 'Manajemen pengisian kulkas suti per lokasi',
};

export default function RefrigeratorsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <RefrigeratorsView />
    </div>
  );
}
```


#### `apps/web/src/components/refrigerators/refrigerators-view.tsx`

> Membaca role dari `useAuthStore` (`@/store/auth`). Jika store auth Anda berbeda, sesuaikan import & cara baca `user.role`.

```tsx
'use client';

import { Plus, Search, Snowflake, Box, Wallet, CircleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeleteRefrigerator,
  useRefrigerators,
  useRefrigeratorSummary,
} from '@/hooks/use-refrigerators';
import { useDebounce } from '@/hooks/use-debounce';
import { formatNumber, formatRupiah } from '@/lib/format';
// Sesuaikan path store auth Anda bila berbeda.
import { useAuthStore } from '@/store/auth';
import type { Refrigerator } from '@/types/refrigerator';

import { FillDialog } from './fill-dialog';
import { FillHistoryDialog } from './fill-history-dialog';
import { RefrigeratorCard } from './refrigerator-card';
import { RefrigeratorFormDialog } from './refrigerator-form-dialog';

export function RefrigeratorsView() {
  const role = useAuthStore((s) => s.user?.role);
  const canDelete = role === 'SUPER_ADMIN' || role === 'PIMPINAN';

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 350);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useRefrigerators({ page, limit: 12, search });
  const { data: summary } = useRefrigeratorSummary();
  const deleteMut = useDeleteRefrigerator();

  // State dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Refrigerator | null>(null);
  const [fillTarget, setFillTarget] = useState<Refrigerator | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Refrigerator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Refrigerator | null>(null);

  const items = data?.data ?? [];
  const meta = data?.meta;

  const summaryCards = useMemo(
    () => [
      {
        icon: Snowflake,
        label: 'Total kulkas',
        value: formatNumber(summary?.totalRefrigerators ?? 0),
        tone: 'text-sky-600',
      },
      {
        icon: CircleAlert,
        label: 'Belum diisi hari ini',
        value: formatNumber(summary?.notFilledToday ?? 0),
        tone: 'text-amber-600',
      },
      {
        icon: Box,
        label: 'Kardus hari ini',
        value: formatNumber(summary?.boxCountToday ?? 0),
        tone: 'text-violet-600',
      },
      {
        icon: Wallet,
        label: 'Nilai terisi hari ini',
        value: formatRupiah(summary?.totalCostToday ?? 0),
        tone: 'text-emerald-600',
      },
    ],
    [summary],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: Refrigerator) => {
    setEditing(r);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Kulkas "${deleteTarget.name}" dihapus`);
        setDeleteTarget(null);
      },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menghapus kulkas'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kulkas Suti</h1>
          <p className="text-sm text-muted-foreground">
            Pantau dan catat pengisian suti di setiap kulkas.
          </p>
        </div>
        <Button onClick={openCreate} className="sm:self-start">
          <Plus className="mr-2 size-4" /> Tambah Kulkas
        </Button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-lg bg-muted">
                <c.icon className={`size-5 ${c.tone}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{c.label}</p>
                <p className="truncate text-lg font-bold tabular-nums">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pencarian */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Cari kulkas / lokasi…"
          className="pl-9"
        />
      </div>

      {/* Grid kartu */}
      {isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Gagal memuat data kulkas. Coba muat ulang halaman.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Snowflake className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Belum ada kulkas</p>
              <p className="text-sm text-muted-foreground">
                Tambahkan kulkas pertama untuk mulai mencatat pengisian.
              </p>
            </div>
            <Button onClick={openCreate} variant="outline">
              <Plus className="mr-2 size-4" /> Tambah Kulkas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <RefrigeratorCard
                key={r.id}
                refrigerator={r}
                canDelete={canDelete}
                onFill={setFillTarget}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onHistory={setHistoryTarget}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {meta.page} dari {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          ) : null}
        </>
      )}

      {/* Dialog */}
      <RefrigeratorFormDialog refrigerator={editing} open={formOpen} onOpenChange={setFormOpen} />
      <FillDialog
        refrigerator={fillTarget}
        open={!!fillTarget}
        onOpenChange={(o) => !o && setFillTarget(null)}
      />
      <FillHistoryDialog
        refrigerator={historyTarget}
        open={!!historyTarget}
        onOpenChange={(o) => !o && setHistoryTarget(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kulkas ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kulkas <strong>{deleteTarget?.name}</strong> akan dinonaktifkan (soft delete).
              Riwayat pengisian tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? 'Menghapus…' : 'Ya, hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```


#### `apps/web/src/components/refrigerators/refrigerator-card.tsx`

```tsx
'use client';

import { MapPin, MoreVertical, Pencil, Trash2, History, PlusCircle, Snowflake } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime, formatNumber, formatRupiah } from '@/lib/format';
import type { Refrigerator } from '@/types/refrigerator';

interface Props {
  refrigerator: Refrigerator;
  canDelete?: boolean;
  onFill: (r: Refrigerator) => void;
  onEdit: (r: Refrigerator) => void;
  onDelete: (r: Refrigerator) => void;
  onHistory: (r: Refrigerator) => void;
}

export function RefrigeratorCard({
  refrigerator,
  canDelete = false,
  onFill,
  onEdit,
  onDelete,
  onHistory,
}: Props) {
  const today = refrigerator.todayFill;
  const filledToday = (today?.fillCount ?? 0) > 0;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <Snowflake className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold leading-tight">{refrigerator.name}</h3>
              {refrigerator.code ? (
                <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                  {refrigerator.code}
                </Badge>
              ) : null}
            </div>
            {refrigerator.location ? (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                {refrigerator.location}
              </p>
            ) : null}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <MoreVertical className="size-4" />
              <span className="sr-only">Menu kulkas</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onHistory(refrigerator)}>
              <History className="mr-2 size-4" /> Riwayat pengisian
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(refrigerator)}>
              <Pencil className="mr-2 size-4" /> Edit kulkas
            </DropdownMenuItem>
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(refrigerator)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" /> Hapus kulkas
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Hari ini sudah terisi</p>

          {filledToday ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">
                  {formatNumber(today!.boxCount)}
                </span>
                <span className="text-sm text-muted-foreground">kardus</span>
                {today!.totalBottles > 0 ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatNumber(today!.totalBottles)} botol
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total nilai</span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(today!.totalCost)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Belum ada pengisian hari ini.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2 border-t bg-muted/20 pt-3">
        <Button onClick={() => onFill(refrigerator)} className="w-full">
          <PlusCircle className="mr-2 size-4" /> Isi Kulkas
        </Button>
        {today?.lastFillAt ? (
          <p className="text-center text-[11px] text-muted-foreground">
            Pengisian terakhir: {formatDateTime(today.lastFillAt)}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
```


#### `apps/web/src/components/refrigerators/fill-dialog.tsx`

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateFill } from '@/hooks/use-refrigerators';
import { formatNumber, formatRupiah, todayISO } from '@/lib/format';
import type { Refrigerator } from '@/types/refrigerator';

const schema = z.object({
  fillDate: z.string().min(1, 'Tanggal wajib diisi'),
  boxCount: z.coerce.number().int('Harus bilangan bulat').positive('Minimal 1 kardus'),
  pricePerBox: z.coerce.number().min(0, 'Tidak boleh negatif'),
  pricePerBottle: z.coerce.number().min(0, 'Tidak boleh negatif'),
  bottlesPerBox: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  refrigerator: Refrigerator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FillDialog({ refrigerator, open, onOpenChange }: Props) {
  const mutation = useCreateFill();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fillDate: todayISO(),
      boxCount: 1,
      pricePerBox: 0,
      pricePerBottle: 0,
      bottlesPerBox: 0,
      notes: '',
    },
  });

  // Reset form setiap kali dialog dibuka untuk kulkas baru.
  useEffect(() => {
    if (open) {
      reset({
        fillDate: todayISO(),
        boxCount: 1,
        pricePerBox: 0,
        pricePerBottle: 0,
        bottlesPerBox: 0,
        notes: '',
      });
    }
  }, [open, refrigerator?.id, reset]);

  // Preview total real-time.
  const boxCount = Number(watch('boxCount')) || 0;
  const pricePerBox = Number(watch('pricePerBox')) || 0;
  const bottlesPerBox = Number(watch('bottlesPerBox')) || 0;
  const pricePerBottle = Number(watch('pricePerBottle')) || 0;

  const totalCost = boxCount * pricePerBox;
  const totalBottles = boxCount * bottlesPerBox;
  const estRevenue = totalBottles * pricePerBottle;

  const onSubmit = (values: FormValues) => {
    if (!refrigerator) return;
    mutation.mutate(
      {
        refrigeratorId: refrigerator.id,
        payload: {
          fillDate: values.fillDate,
          boxCount: values.boxCount,
          pricePerBox: values.pricePerBox,
          pricePerBottle: values.pricePerBottle,
          bottlesPerBox: values.bottlesPerBox || 0,
          notes: values.notes || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Pengisian ${refrigerator.name} berhasil dicatat`);
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message ?? 'Gagal mencatat pengisian');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Isi Kulkas</DialogTitle>
          <DialogDescription>
            {refrigerator?.name}
            {refrigerator?.location ? ` • ${refrigerator.location}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="fillDate">Tanggal pengisian</Label>
              <Input id="fillDate" type="date" {...register('fillDate')} />
              {errors.fillDate ? (
                <p className="text-xs text-destructive">{errors.fillDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="boxCount">Jumlah kardus</Label>
              <Input id="boxCount" type="number" min={1} {...register('boxCount')} />
              {errors.boxCount ? (
                <p className="text-xs text-destructive">{errors.boxCount.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pricePerBox">Harga / kardus (Rp)</Label>
              <Input id="pricePerBox" type="number" min={0} step="any" {...register('pricePerBox')} />
              {errors.pricePerBox ? (
                <p className="text-xs text-destructive">{errors.pricePerBox.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pricePerBottle">Harga jual / botol (Rp)</Label>
              <Input
                id="pricePerBottle"
                type="number"
                min={0}
                step="any"
                {...register('pricePerBottle')}
              />
              {errors.pricePerBottle ? (
                <p className="text-xs text-destructive">{errors.pricePerBottle.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bottlesPerBox">
                Botol / kardus <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input id="bottlesPerBox" type="number" min={0} {...register('bottlesPerBox')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea id="notes" rows={2} {...register('notes')} placeholder="Mis. titip ke petugas kebersihan" />
          </div>

          {/* Preview total */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">Total nilai</p>
              <p className="font-semibold tabular-nums">{formatRupiah(totalCost)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total botol</p>
              <p className="font-semibold tabular-nums">{formatNumber(totalBottles)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Est. penjualan</p>
              <p className="font-semibold tabular-nums">{formatRupiah(estRevenue)}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan…' : 'Simpan pengisian'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```


#### `apps/web/src/components/refrigerators/refrigerator-form-dialog.tsx`

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRefrigerator, useUpdateRefrigerator } from '@/hooks/use-refrigerators';
import type { Refrigerator } from '@/types/refrigerator';

const schema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150),
  location: z.string().trim().max(150).optional(),
  code: z
    .string()
    .trim()
    .max(50)
    .regex(/^[A-Za-z0-9_-]*$/, 'Hanya huruf, angka, - dan _')
    .optional(),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  /** null = mode tambah, objek = mode edit */
  refrigerator: Refrigerator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefrigeratorFormDialog({ refrigerator, open, onOpenChange }: Props) {
  const isEdit = !!refrigerator;
  const createMut = useCreateRefrigerator();
  const updateMut = useUpdateRefrigerator();
  const pending = createMut.isPending || updateMut.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', location: '', code: '', description: '', isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: refrigerator?.name ?? '',
      location: refrigerator?.location ?? '',
      code: refrigerator?.code ?? '',
      description: refrigerator?.description ?? '',
      isActive: refrigerator?.isActive ?? true,
    });
  }, [open, refrigerator, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      location: values.location || null,
      code: values.code || null,
      description: values.description || null,
      isActive: values.isActive,
    };

    const onError = (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Terjadi kesalahan');

    if (isEdit) {
      updateMut.mutate(
        { id: refrigerator!.id, payload },
        {
          onSuccess: () => {
            toast.success('Kulkas berhasil diperbarui');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Kulkas baru berhasil ditambahkan');
          onOpenChange(false);
        },
        onError,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Kulkas' : 'Tambah Kulkas'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi kulkas suti.'
              : 'Tambahkan kartu kulkas baru untuk satu lokasi.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama kulkas</Label>
            <Input id="name" placeholder="Mis. Kulkas Masjid" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">Lokasi / Fakultas</Label>
              <Input id="location" placeholder="Mis. Teknik" {...register('location')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Kode (opsional)</Label>
              <Input id="code" placeholder="Mis. TEK" {...register('code')} />
              {errors.code ? <p className="text-xs text-destructive">{errors.code.message}</p> : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="isActive">Status aktif</Label>
              <p className="text-xs text-muted-foreground">Kulkas nonaktif disembunyikan dari operasional.</p>
            </div>
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(v) => setValue('isActive', v)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Tambah kulkas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```


#### `apps/web/src/components/refrigerators/fill-history-dialog.tsx`

```tsx
'use client';

import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRefrigeratorFills } from '@/hooks/use-refrigerators';
import { formatDate, formatNumber, formatRupiah } from '@/lib/format';
import type { Refrigerator } from '@/types/refrigerator';

interface Props {
  refrigerator: Refrigerator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FillHistoryDialog({ refrigerator, open, onOpenChange }: Props) {
  const { data, isLoading } = useRefrigeratorFills(
    refrigerator?.id ?? '',
    { page: 1, limit: 20 },
    open && !!refrigerator,
  );

  const rows = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Riwayat Pengisian</DialogTitle>
          <DialogDescription>{refrigerator?.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Memuat riwayat…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Belum ada riwayat pengisian untuk kulkas ini.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Kardus</TableHead>
                  <TableHead className="text-right">Harga/kardus</TableHead>
                  <TableHead className="text-right">Total nilai</TableHead>
                  <TableHead>Petugas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(f.fillDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(f.boxCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(f.pricePerBox)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatRupiah(f.totalCost)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.user?.name ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## LANGKAH 4 — Navigasi sidebar

Tambahkan satu entri menu **"Kulkas"** mengarah ke `/dashboard/refrigerators` pada
konfigurasi sidebar yang kamu temukan di Langkah 0. Ikuti bentuk objek menu yang sudah
dipakai item lain. Pakai ikon `Snowflake` dari `lucide-react`. Contoh bila menu berupa
array objek:

```ts
import { Snowflake } from 'lucide-react';
// ... di dalam array nav:
{ title: 'Kulkas', href: '/dashboard/refrigerators', icon: Snowflake },
```

Letakkan posisinya yang masuk akal (mis. dekat menu stok/produk).

---

## LANGKAH 5 — Dependency UI

Pastikan komponen shadcn/ui ini tersedia; tambahkan yang belum ada:

```bash
npx shadcn@latest add card button badge dropdown-menu dialog alert-dialog input label textarea switch skeleton table
```

Toast memakai **sonner**. Pastikan terpasang dan `<Toaster />` sudah dirender di layout:

```bash
npm i sonner -w apps/web
```

Jika repo memakai `useToast` lama alih-alih sonner, ganti pemanggilan `toast(...)`
pada file frontend di atas agar sesuai.

---

## LANGKAH 6 — Util minimal (hanya jika belum ada)

Jika `asyncHandler` belum ada di repo, buat `apps/api/src/utils/asyncHandler.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

`ApiError`, `createAuditLog`, `prisma`, dan middleware diasumsikan sudah ada sesuai
dokumen sistem. Bila salah satu belum ada, beri tahu saya alih-alih menebak logikanya.

---

## LANGKAH 7 — Migrasi & verifikasi

Jalankan berurutan dari root repo, lalu laporkan hasilnya:

```bash
npx prisma migrate dev --name add_refrigerators
npx prisma generate
# typecheck/build sesuai skrip repo, mis:
npm run build -w apps/api
npm run build -w apps/web
```

Kalau ada error tipe karena perbedaan path util, perbaiki **hanya** importnya dan
jalankan ulang. Selesai itu, berikan ringkasan singkat: file yang dibuat, baris yang
disisipkan ke schema/route/sidebar, dan import apa pun yang kamu sesuaikan.

---

## KONTRAK API (acuan verifikasi)

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/refrigerators` | semua login |
| GET | `/refrigerators/summary` | semua login |
| GET | `/refrigerators/:id` | semua login |
| POST | `/refrigerators` | semua login |
| PUT | `/refrigerators/:id` | semua login |
| DELETE | `/refrigerators/:id` | SUPER_ADMIN, PIMPINAN |
| POST | `/refrigerators/:id/fills` | semua login |
| GET | `/refrigerators/:id/fills` | semua login |
| DELETE | `/refrigerators/:id/fills/:fillId` | SUPER_ADMIN, PIMPINAN |

Semua respons memakai envelope standar `{ success, message, data, meta? }`; nilai
`Decimal` dikirim sebagai **string**.

> Rekap uang pekanan + bagi hasil (40/60) dari foto laporan adalah **Tahap 2** dan
> tidak termasuk task ini.
