# TASK CLAUDE CODE — Tambahan "Ukuran Kemasan" pada Laporan Barang Masuk & Keluar

Kamu adalah senior programmer yang menambah satu kemampuan ke repo **Suti Water
System** (Turborepo: `apps/api` Express+Prisma, `apps/web` Next.js 16 App Router,
`prisma/`). Semua kode & komentar dalam Bahasa Indonesia.

**Yang diminta user:**
1. Saat **input barang masuk (StockIn)** dan **barang keluar (StockOut)**, bisa
   memilih **ukuran kemasan** (200ml … Galon) lewat **radio button**.
2. Di **laporan** barang masuk & keluar, bisa memilih **"Keseluruhan"** atau
   **per ukuran** (juga via radio/segmented), dan melihat rekap per ukuran.

> Catatan: ini **memperluas modul stok & laporan yang SUDAH ADA** di repo (StockIn,
> StockOut, dan halaman laporannya). Bukan modul baru. Kamu harus menemukan file-file
> itu sendiri lalu menyuntingnya secara bedah. Beberapa potongan baru yang siap pakai
> sudah disediakan di bawah.

---

## ASUMSI (WAJIB DIVERIFIKASI SEBELUM MIGRASI)

1. **Produk bersifat generik**, sehingga ukuran dipilih **per transaksi** lewat radio
   dan disimpan di baris StockIn/StockOut. **JIKA ternyata tiap produk sudah punya
   ukuran sendiri** (mis. ada produk "Suti 600ml" terpisah dari "Suti Galon"), **JANGAN
   migrasi** — hentikan dan beri tahu user, karena dalam kasus itu ukuran harus diambil
   dari relasi produk, bukan kolom baru per transaksi.
2. **Daftar ukuran default:** `200ml, 330ml, 600ml, 1500ml, Galon`. Diedit di satu
   tempat (`apps/web/src/lib/water-sizes.ts` + cermin di `apps/api`). **Bukan enum
   Prisma** — kolomnya `String?` — agar mengubah daftar tidak perlu migrasi.

---

## ATURAN EKSEKUSI (baca semua dulu, lalu kerjakan berurutan)

1. **Baca seluruh file ini sampai habis sebelum menulis apa pun.**
2. **Deteksi dulu (jangan asumsi buta):**
   - Model `StockIn` & `StockOut` di `prisma/schema.prisma` — catat **nama kolom
     sebenarnya** untuk: jumlah/kuantitas (mis. `quantity`/`qty`), nilai total (mis.
     `totalPrice`/`subtotal`/`priceBuy`), dan tanggal (mis. `entryDate`/`createdAt`).
   - **Form input** barang masuk & keluar di `apps/web` (cari form yang membuat
     StockIn/StockOut — biasanya di `components/stock-in*`, `components/stock-out*`,
     atau modul serupa; tandanya ada field quantity, harga, supplier/agent).
   - **Halaman/laporan** barang masuk & keluar (cari di `apps/web/src/app` kata
     `report`/`laporan`/`stock`, dan di `apps/api` route/controller laporan). Jika
     **tidak ada** halaman laporan khusus dan yang ada hanya daftar transaksi, perlakukan
     daftar itu sebagai "laporan" dan tempelkan filter di sana.
   - **Zod schema & service** untuk create StockIn/StockOut.
   - Util & komponen yang dipakai potongan di bawah: `prisma` (`config/prisma`),
     `cn` (`@/lib/utils`), `formatRupiah`/`formatNumber` (`@/lib/format`), komponen
     shadcn `radio-group`, `button`, `table`, `label`. Sesuaikan import bila path repo berbeda.
3. Untuk file **BARU** di bawah: buat apa adanya. Untuk file **LAMA**: sunting bedah
   sesuai instruksi — jangan menulis ulang seluruh file, jangan mengubah logika lain.
4. **Jangan jalankan migrasi / install diam-diam di tengah.** Kumpulkan di Langkah 6,
   dan jalankan migrasi hanya setelah Asumsi #1 dipastikan benar.
5. Selesai, laporkan ringkas: file dibuat, baris yang disuntikkan ke schema/form/laporan,
   dan nama kolom yang kamu sesuaikan.

---

## LANGKAH 1 — Skema: tambah kolom `size`

Sunting `prisma/schema.prisma`. **Di dalam** `model StockIn { ... }` tambahkan satu
field dan satu index (letakkan field di antara kolom lain, index di blok atribut model):

```prisma
  size String? @map("size") @db.VarChar(20) // ukuran kemasan: "200ml" … "Galon" (null = lama/tak berukuran)
```
```prisma
  @@index([size])
```

Lakukan **hal yang sama persis** di dalam `model StockOut { ... }`.

> `String?` (nullable) dipilih agar baris lama tetap valid tanpa backfill. Migrasi
> dijalankan di Langkah 6.

---

## LANGKAH 2 — Sumber kebenaran daftar ukuran

### FILE BARU: `apps/web/src/lib/water-sizes.ts`

```ts
// Satu-satunya tempat mengubah daftar ukuran kemasan (frontend).
// Mengubah daftar di sini otomatis mengubah radio input & filter laporan.
export const WATER_SIZES = ['200ml', '330ml', '600ml', '1500ml', 'Galon'] as const;
export type WaterSize = (typeof WATER_SIZES)[number];

// Nilai khusus untuk filter laporan "semua ukuran".
export const SIZE_ALL = 'ALL' as const;
export type SizeFilter = typeof SIZE_ALL | WaterSize;

// Opsi untuk filter laporan (Keseluruhan + tiap ukuran).
export const SIZE_OPTIONS: { label: string; value: SizeFilter }[] = [
  { label: 'Keseluruhan', value: SIZE_ALL },
  ...WATER_SIZES.map((s) => ({ label: s, value: s })),
];
```

### FILE BARU: `apps/api/src/constants/waterSizes.ts`

```ts
// Cermin dari apps/web/src/lib/water-sizes.ts — JAGA AGAR SINKRON.
// (Bila repo punya shared package, lebih baik pindahkan ke sana dan impor di kedua app.)
export const WATER_SIZES = ['200ml', '330ml', '600ml', '1500ml', 'Galon'] as const;
export type WaterSize = (typeof WATER_SIZES)[number];
```

### SUNTING (LAMA): Zod schema create StockIn & StockOut

Tambahkan field `size` (opsional, divalidasi ke daftar) pada schema **create** untuk
StockIn dan StockOut. Sesuaikan dengan gaya schema kamu:

```ts
import { WATER_SIZES } from '../../constants/waterSizes'; // sesuaikan path relatif
// ... di dalam objek body schema create:
  size: z.enum(WATER_SIZES).optional(),
```

> Karena `z.enum`, ukuran asing akan ditolak. Untuk menambah ukuran, cukup ubah
> `WATER_SIZES` di kedua konstanta — tanpa migrasi.

### SUNTING (LAMA): service create StockIn & StockOut

Pastikan `size` ikut diteruskan ke `prisma.stockIn.create` / `prisma.stockOut.create`
(di dalam `data: { ... }`), mengambil dari payload yang sudah tervalidasi. Tidak ada
perubahan logika FIFO/transaksi lain.

---

## LANGKAH 3 — Radio ukuran di FORM input

### FILE BARU: `apps/web/src/components/common/size-radio-group.tsx`

```tsx
'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WATER_SIZES } from '@/lib/water-sizes';
import { cn } from '@/lib/utils';

interface SizeRadioGroupProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/** Pemilih ukuran kemasan untuk form barang masuk/keluar. */
export function SizeRadioGroup({
  value,
  onChange,
  label = 'Ukuran',
  className,
  disabled,
}: SizeRadioGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="flex flex-wrap gap-3"
      >
        {WATER_SIZES.map((size) => (
          <div key={size} className="flex items-center gap-2">
            <RadioGroupItem value={size} id={`size-${size}`} />
            <Label htmlFor={`size-${size}`} className="cursor-pointer font-normal">
              {size}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
```

### SUNTING (LAMA): form barang masuk & barang keluar

Pada **kedua** form yang kamu temukan (StockIn dan StockOut):

1. Tambahkan `size` ke `defaultValues` React Hook Form (`size: undefined`).
2. Render pemilihnya. Jika form pakai `Controller` RHF:

```tsx
import { Controller } from 'react-hook-form';
import { SizeRadioGroup } from '@/components/common/size-radio-group';
// ... di dalam JSX form:
<Controller
  control={control}
  name="size"
  render={({ field }) => (
    <SizeRadioGroup value={field.value} onChange={field.onChange} />
  )}
/>
```

3. Pastikan `size` ikut terkirim di payload submit ke API (otomatis bila pakai `...data`).
4. Jika ingin **wajib diisi**, tambahkan validasi di schema form (`z.enum(WATER_SIZES)`
   tanpa `.optional()`); default biarkan opsional sesuai permintaan.

---

## LANGKAH 4 — Backend laporan: filter & rekap per ukuran

Tujuan: laporan bisa (a) **difilter** ke satu ukuran, dan (b) memberi **rekap per
ukuran** untuk tampilan "Keseluruhan".

### FILE BARU: `apps/api/src/modules/reports/stock-size-report.ts`

> ⚠️ **Sesuaikan nama kolom** yang ditandai dengan hasil deteksimu di Langkah 0
> (`quantity`, `totalPrice`, `entryDate`). Bila berbeda, ganti di sini saja.

```ts
import { prisma } from '../../config/prisma';

export type StockType = 'in' | 'out';

export interface StockReportRange {
  from?: Date;
  to?: Date;
  size?: string; // bila diisi & bukan "ALL" → difilter ke ukuran ini
}

function buildWhere({ from, to, size }: StockReportRange) {
  const where: Record<string, unknown> = {};
  // GANTI `entryDate` bila kolom tanggalmu bernama lain (mis. createdAt).
  if (from || to) {
    where.entryDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }
  if (size && size !== 'ALL') where.size = size;
  return where;
}

function model(type: StockType) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (type === 'in' ? prisma.stockIn : prisma.stockOut) as any;
}

/** Rekap dikelompokkan per ukuran (untuk tampilan "Keseluruhan"). */
export async function getStockBreakdownBySize(type: StockType, range: StockReportRange) {
  const grouped = await model(type).groupBy({
    by: ['size'],
    where: buildWhere({ from: range.from, to: range.to }), // breakdown selalu lintas ukuran
    // GANTI `quantity` / `totalPrice` sesuai kolommu:
    _sum: { quantity: true, totalPrice: true },
    _count: { _all: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return grouped.map((g: any) => ({
    size: g.size as string | null,
    totalQty: Number(g._sum.quantity ?? 0),
    totalValue: (g._sum.totalPrice ?? 0).toString(),
    count: g._count._all as number,
  }));
}

/** Daftar transaksi (opsional difilter satu ukuran) untuk tabel detail laporan. */
export async function getStockRows(type: StockType, range: StockReportRange) {
  return model(type).findMany({
    where: buildWhere(range),
    orderBy: { entryDate: 'desc' }, // sesuaikan nama kolom tanggal
    // sertakan relasi produk/supplier bila laporan menampilkannya:
    // include: { product: true },
  });
}
```

### SUNTING / TAMBAH (route + controller laporan)

- **Jika sudah ada** endpoint laporan stok: tambahkan query param opsional `size`
  (teruskan ke `where`), dan tambahkan satu field `breakdownBySize` pada respons yang
  diisi dari `getStockBreakdownBySize(...)`.
- **Jika belum ada**, buat endpoint ringkas memakai helper di atas, mis.:
  - `GET /reports/stock?type=in|out&from=&to=&size=` → `{ rows, breakdownBySize }`.
  Pasang dengan middleware auth yang sama seperti modul lain (`verifyJWT`, dst.),
  dan validasi query (`type` wajib `in|out`; `size` opsional `z.enum(WATER_SIZES)`).

Bungkus respons dengan envelope standar repo (`{ success, message, data, meta? }`).

---

## LANGKAH 5 — Laporan di FRONTEND: filter & rekap

### FILE BARU: `apps/web/src/components/reports/size-filter-tabs.tsx`

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { SIZE_OPTIONS, type SizeFilter } from '@/lib/water-sizes';
import { cn } from '@/lib/utils';

interface SizeFilterTabsProps {
  value: SizeFilter;
  onChange: (value: SizeFilter) => void;
  className?: string;
}

/** Filter laporan: "Keseluruhan" atau salah satu ukuran. */
export function SizeFilterTabs({ value, onChange, className }: SizeFilterTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {SIZE_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? 'default' : 'outline'}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
```

### FILE BARU: `apps/web/src/components/reports/size-breakdown-table.tsx`

```tsx
'use client';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatRupiah, formatNumber } from '@/lib/format';

export interface SizeBreakdownRow {
  size: string | null;
  totalQty: number;
  totalValue: string | number;
  count: number;
}

/** Tabel rekap per ukuran untuk tampilan laporan "Keseluruhan". */
export function SizeBreakdownTable({ rows }: { rows: SizeBreakdownRow[] }) {
  const tQty = rows.reduce((a, r) => a + r.totalQty, 0);
  const tVal = rows.reduce((a, r) => a + Number(r.totalValue), 0);
  const tCnt = rows.reduce((a, r) => a + r.count, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ukuran</TableHead>
          <TableHead className="text-right">Jumlah</TableHead>
          <TableHead className="text-right">Transaksi</TableHead>
          <TableHead className="text-right">Total Nilai</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.size ?? 'tanpa-ukuran'}>
            <TableCell>{r.size ?? 'Tanpa ukuran'}</TableCell>
            <TableCell className="text-right">{formatNumber(r.totalQty)}</TableCell>
            <TableCell className="text-right">{formatNumber(r.count)}</TableCell>
            <TableCell className="text-right">{formatRupiah(r.totalValue)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="font-semibold">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">{formatNumber(tQty)}</TableCell>
          <TableCell className="text-right">{formatNumber(tCnt)}</TableCell>
          <TableCell className="text-right">{formatRupiah(tVal)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

### SUNTING (LAMA): halaman laporan barang masuk & keluar

Di halaman laporan yang kamu temukan (untuk **masuk** dan **keluar**):

1. Simpan state filter ukuran:
   ```tsx
   import { SIZE_ALL, type SizeFilter } from '@/lib/water-sizes';
   const [sizeFilter, setSizeFilter] = useState<SizeFilter>(SIZE_ALL);
   ```
2. Render `<SizeFilterTabs value={sizeFilter} onChange={setSizeFilter} />` di area filter
   (dekat filter tanggal yang sudah ada).
3. Saat memanggil API laporan, kirim `size` **hanya bila bukan** `SIZE_ALL`:
   ```ts
   const params = { type, from, to, ...(sizeFilter !== SIZE_ALL ? { size: sizeFilter } : {}) };
   ```
4. Tampilan:
   - Saat **Keseluruhan**: render `<SizeBreakdownTable rows={data.breakdownBySize} />`
     di atas/atau di samping tabel detail.
   - Saat **satu ukuran**: tabel detail otomatis hanya berisi ukuran itu (karena filter
     `size` dikirim ke API). Breakdown boleh disembunyikan.
5. Jika laporan memakai TanStack Query, masukkan `sizeFilter` ke `queryKey` agar refetch
   saat filter berubah.

---

## LANGKAH 6 — Dependency, migrasi, verifikasi

Pastikan komponen radio shadcn ada:

```bash
npx shadcn@latest add radio-group
```

Setelah **Asumsi #1 dipastikan benar**, jalankan migrasi & build dari root repo:

```bash
npx prisma migrate dev --name add_size_to_stock_movements
npx prisma generate
npm run build -w apps/api
npm run build -w apps/web
```

Bila ada error tipe karena perbedaan nama kolom (quantity/totalPrice/entryDate) atau
path util, **perbaiki hanya itu** lalu jalankan ulang.

---

## RINGKAS YANG HARUS DILAPORKAN SETELAH SELESAI

- File baru yang dibuat (6: 2 konstanta, 1 radio form, 1 helper backend, 2 komponen laporan).
- Baris yang disuntikkan ke `schema.prisma` (StockIn & StockOut), Zod, service create,
  form masuk & keluar, route/controller laporan, dan halaman laporan.
- Nama kolom asli yang kamu pakai untuk jumlah, nilai total, dan tanggal.
- Konfirmasi bahwa produk memang generik (Asumsi #1). Bila tidak, jangan migrasi —
  laporkan ke user.
