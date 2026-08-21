/**
 * Backfill data barang masuk (StockIn) + barang keluar (StockOut) historis
 * Mei-Juli 2026, versi EXACT — pakai angka penjualan harian ASLI dari file
 * `Breakdown_Penjualan_Harian_Suti.xlsx` (sheet Mei/Juni/Juli), bukan hasil
 * random dengan lonjakan Jumat seperti di prisma/backfill-mei-jul-2026.ts.
 *
 * Total bulanan di file Excel (sheet "Ringkasan Bulanan") PERSIS SAMA dengan
 * MONTHLY_TOTAL_BY_SIZE di script lama (200ml: 754/739/836, 330ml:
 * 1645/2148/2241) — jadi script ini menggantikan distribusi harian yang tadinya
 * ditebak dengan distribusi harian yang sebenarnya terjadi, sambil tetap
 * mempertahankan seluruh mekanisme lain dari script lama:
 *   1. Memastikan 2 produk ada (sama seperti sebelumnya).
 *   2. Menghapus StockIn+StockOut historis punya 2 produk ini di rentang
 *      Mei-Juli 2026 kalau ada (idempotent — aman dijalankan ulang), sambil
 *      membalikkan efek stoknya dulu sebelum dihapus.
 *   3. Insert StockIn baru: 1 baris per bulan per ukuran (6 baris), qty =
 *      total StockOut bulan itu (barang masuk = barang terjual).
 *   4. Insert StockOut baru: 1 baris per hari per ukuran sesuai DAILY_SALES
 *      di bawah (angka asli dari Excel), lalu dipecah per exit_type
 *      (AGEN/KULKAS/SEDEKAH 50/45/5 — proporsi ini TETAP estimasi karena
 *      Excel sumbernya tidak punya breakdown exit_type), FIFO deplete
 *      StockIn.remainingStock + decrement Product.stock seperti alur normal.
 *
 * CARA PAKAI:
 *   1. npx tsx prisma/backfill-mei-jul-2026-exact.ts            -> DRY RUN (baca-saja, aman)
 *   2. Backup manual disarankan sebelum apply:
 *      docker exec <container_db> pg_dump -U <user> -d <db> -t products -t stock_in -t stock_out > backup.sql
 *      (script ini JUGA otomatis export JSON backup StockIn+StockOut yang mau dihapus)
 *   3. npx tsx prisma/backfill-mei-jul-2026-exact.ts --apply --confirm=DELETE-MEI-JUL-2026-EXACT
 *
 * CATATAN: kalau prisma/backfill-mei-jul-2026.ts (versi random) sudah pernah
 * di --apply sebelumnya, script ini AMAN dijalankan setelahnya — Fase 1 di
 * bawah menghapus semua StockIn+StockOut lama punya 2 produk ini di rentang
 * Mei-Juli (dari script manapun) sebelum insert ulang dengan angka asli.
 */

import { PrismaClient, StockOutType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ============================================================
 * KONFIGURASI — REVIEW SEMUA NILAI DI BAWAH SEBELUM MENJALANKAN
 * ============================================================ */

const YEAR = 2026;
const MONTHS = [5, 6, 7] as const; // Mei, Juni, Juli

const PRODUCTS_TO_ENSURE: {
  size: string;
  name: string;
  unit: string;
  priceSell: number;
  priceBuy: number;
  initialStock: number; // placeholder ("asal dulu aja") — dipakai HANYA saat create produk baru
}[] = [
  { size: '200ml', name: 'Suti Water Cup', unit: 'Kardus', priceSell: 20000, priceBuy: 15000, initialStock: 100 },
  { size: '330ml', name: 'Suti Water Botol', unit: 'Kardus', priceSell: 35000, priceBuy: 27000, initialStock: 100 },
];

const SUPPLIER_NAME = 'Supplier Suti Water';

// Angka penjualan harian ASLI, diambil apa adanya dari
// Breakdown_Penjualan_Harian_Suti.xlsx (sheet Mei/Juni/Juli, kolom "Ukuran
// 330ml (Pcs)" / "Ukuran 200ml (Pcs)"). Index array = tanggal - 1.
const DAILY_SALES: Record<string, Record<number, number[]>> = {
  '330ml': {
    5: [60, 54, 61, 70, 53, 53, 72, 63, 50, 60, 50, 50, 57, 36, 38, 49, 45, 58, 46, 41, 70, 53, 56, 41, 50, 56, 44, 59, 49, 52, 49],
    6: [84, 82, 60, 67, 75, 83, 64, 68, 56, 55, 81, 88, 70, 83, 75, 62, 75, 90, 70, 90, 37, 81, 72, 67, 72, 45, 68, 75, 89, 64],
    7: [69, 67, 88, 83, 38, 88, 97, 85, 67, 61, 79, 62, 74, 70, 85, 65, 64, 75, 94, 71, 65, 81, 79, 58, 63, 84, 75, 39, 76, 81, 58],
  },
  '200ml': {
    5: [32, 29, 26, 22, 19, 26, 21, 18, 22, 22, 25, 23, 29, 27, 23, 20, 29, 27, 36, 25, 31, 26, 24, 17, 27, 20, 22, 24, 23, 17, 22],
    6: [21, 23, 29, 26, 22, 27, 25, 29, 22, 23, 23, 18, 26, 26, 25, 24, 19, 23, 23, 21, 24, 28, 33, 26, 26, 25, 16, 25, 25, 36],
    7: [28, 24, 28, 30, 28, 32, 37, 24, 24, 19, 31, 31, 21, 28, 31, 26, 29, 26, 21, 30, 31, 30, 21, 22, 20, 29, 31, 27, 30, 21, 26],
  },
};

// Campuran jenis keluar (exit_type) untuk StockOut. Harus berjumlah 1.
// TIDAK ada di sumber Excel — tetap estimasi, sama seperti script random.
const EXIT_TYPE_WEIGHTS: { type: StockOutType; weight: number }[] = [
  { type: 'AGEN', weight: 0.5 },
  { type: 'KULKAS', weight: 0.45 },
  { type: 'SEDEKAH', weight: 0.05 },
];

const BUYER_NAME: string | null = null;

const BACKUP_DIR = path.join(__dirname, '..', 'backup-stockout-mei-jul-2026-exact');

/* ============================================================
 * SAFETY GATES — jangan diubah
 * ============================================================ */

const APPLY = process.argv.includes('--apply');
const CONFIRM_FLAG = process.argv.find((a) => a.startsWith('--confirm='));
const CONFIRMED = CONFIRM_FLAG === '--confirm=DELETE-MEI-JUL-2026-EXACT';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rangeStart = new Date(Date.UTC(YEAR, MONTHS[0] - 1, 1));
const rangeEnd = new Date(Date.UTC(YEAR, MONTHS[MONTHS.length - 1], 0));

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Largest-remainder rounding: bagi `total` (integer) menurut `weights`, hasil jumlahnya persis `total`. */
function allocateInt(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / weightSum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    const idx = order[k]!.i;
    result[idx] = (result[idx] ?? 0) + 1;
  }
  return result;
}

interface ResolvedProduct {
  id: string;
  name: string;
  size: string;
  priceSell: number;
  priceBuy: number;
}

async function ensureProducts(tx: any, apply: boolean): Promise<Record<string, ResolvedProduct>> {
  const resolved: Record<string, ResolvedProduct> = {};
  console.log('\n=== Produk yang dibutuhkan ===');

  for (const spec of PRODUCTS_TO_ENSURE) {
    const existing = await tx.product.findFirst({ where: { name: spec.name, deletedAt: null } });

    if (existing) {
      const priceBuyChanged = Number(existing.priceBuy) !== spec.priceBuy;
      if (apply && priceBuyChanged) {
        await tx.product.update({ where: { id: existing.id }, data: { priceBuy: spec.priceBuy } });
      }
      resolved[spec.size] = { id: existing.id, name: existing.name, size: spec.size, priceSell: Number(existing.priceSell), priceBuy: spec.priceBuy };
      console.log(
        `  [SUDAH ADA] ${spec.size.padEnd(6)} -> [${existing.id}] ${existing.name} (stok saat ini: ${existing.stock})` +
        (priceBuyChanged ? `  priceBuy ${existing.priceBuy} -> ${spec.priceBuy}${apply ? ' (DIUPDATE)' : ' (AKAN DIUPDATE)'}` : '')
      );
      continue;
    }

    if (!apply) {
      console.log(`  [AKAN DIBUAT] ${spec.size.padEnd(6)} -> "${spec.name}" | unit=${spec.unit} | harga jual=${spec.priceSell} | harga beli=${spec.priceBuy} | stok awal=${spec.initialStock}`);
      resolved[spec.size] = { id: '(belum dibuat)', name: spec.name, size: spec.size, priceSell: spec.priceSell, priceBuy: spec.priceBuy };
      continue;
    }

    const created = await tx.product.create({
      data: { name: spec.name, unit: spec.unit, priceSell: spec.priceSell, priceBuy: spec.priceBuy, stock: spec.initialStock },
    });
    resolved[spec.size] = { id: created.id, name: created.name, size: spec.size, priceSell: spec.priceSell, priceBuy: spec.priceBuy };
    console.log(`  [DIBUAT] ${spec.size.padEnd(6)} -> [${created.id}] ${created.name}`);
  }

  return resolved;
}

interface StockOutRow {
  date: Date;
  size: string;
  exitType: StockOutType;
  quantity: number;
}

interface StockInRow {
  date: Date;
  size: string;
  quantity: number;
}

function monthlyTotal(size: string, month: number): number {
  const days = DAILY_SALES[size]?.[month] ?? [];
  return days.reduce((a, b) => a + b, 0);
}

function buildStockOutPlan(): StockOutRow[] {
  const exitWeightSum = EXIT_TYPE_WEIGHTS.reduce((a, b) => a + b.weight, 0);
  if (Math.abs(exitWeightSum - 1) > 1e-6) {
    throw new Error(`EXIT_TYPE_WEIGHTS harus berjumlah 1, saat ini ${exitWeightSum}`);
  }

  const plan: StockOutRow[] = [];
  for (const size of Object.keys(DAILY_SALES)) {
    for (const month of MONTHS) {
      const days = DAILY_SALES[size]?.[month] ?? [];
      const nDays = daysInMonth(YEAR, month);
      if (days.length !== nDays) {
        throw new Error(`DAILY_SALES['${size}'][${month}] punya ${days.length} entri, seharusnya ${nDays}`);
      }

      for (let i = 0; i < days.length; i++) {
        const dayTotal = days[i] ?? 0;
        if (dayTotal === 0) continue;
        const date = new Date(Date.UTC(YEAR, month - 1, i + 1));

        const exitQty = allocateInt(dayTotal, EXIT_TYPE_WEIGHTS.map((e) => e.weight));
        for (let e = 0; e < EXIT_TYPE_WEIGHTS.length; e++) {
          const qty = exitQty[e] ?? 0;
          if (qty === 0) continue;
          plan.push({ date, size, exitType: EXIT_TYPE_WEIGHTS[e]!.type, quantity: qty });
        }
      }
    }
  }
  return plan;
}

function buildStockInPlan(): StockInRow[] {
  const plan: StockInRow[] = [];
  for (const size of Object.keys(DAILY_SALES)) {
    for (const month of MONTHS) {
      const quantity = monthlyTotal(size, month);
      if (quantity === 0) continue;
      plan.push({ date: new Date(Date.UTC(YEAR, month - 1, 1)), size, quantity });
    }
  }
  return plan;
}

function printSummary(stockOutPlan: StockOutRow[], stockInPlan: StockInRow[]) {
  console.log('\n=== Ringkasan StockIn (barang masuk) ===');
  for (const row of stockInPlan) {
    console.log(`  Bulan ${row.date.getUTCMonth() + 1} / ${row.size.padEnd(6)} : ${row.quantity} dus masuk (${row.date.toISOString().slice(0, 10)})`);
  }

  console.log('\n=== Ringkasan StockOut (barang keluar), setelah pembulatan exit_type) ===');
  const byMonthSize: Record<string, number> = {};
  const byExitType: Record<string, number> = {};
  let grandTotal = 0;

  for (const row of stockOutPlan) {
    const month = row.date.getUTCMonth() + 1;
    const key = `Bulan ${month} / ${row.size}`;
    byMonthSize[key] = (byMonthSize[key] ?? 0) + row.quantity;
    byExitType[row.exitType] = (byExitType[row.exitType] ?? 0) + row.quantity;
    grandTotal += row.quantity;
  }

  const target = Object.keys(DAILY_SALES).reduce(
    (sum, size) => sum + MONTHS.reduce((s, m) => s + monthlyTotal(size, m), 0),
    0
  );

  for (const [k, v] of Object.entries(byMonthSize)) console.log(`  ${k.padEnd(20)} : ${v} dus`);
  console.log('  ---');
  for (const [k, v] of Object.entries(byExitType)) console.log(`  exit_type ${k.padEnd(8)} : ${v} dus`);
  console.log('  ---');
  console.log(`  GRAND TOTAL          : ${grandTotal} dus (target dari Excel: ${target} dus)`);
  console.log(`  Jumlah baris StockOut yang akan dibuat: ${stockOutPlan.length}`);
  console.log(`  Jumlah baris StockIn yang akan dibuat : ${stockInPlan.length}`);
  console.log('\n  Net efek stok akhir per produk dari histori ini: 0 (barang masuk = barang keluar persis).');
}

async function backupExisting(productIds: string[]) {
  if (productIds.length === 0) return;
  const [existingOut, existingIn] = await Promise.all([
    prisma.stockOut.findMany({ where: { exitDate: { gte: rangeStart, lte: rangeEnd }, productId: { in: productIds } } }),
    prisma.stockIn.findMany({ where: { entryDate: { gte: rangeStart, lte: rangeEnd }, productId: { in: productIds } } }),
  ]);

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `stockin-stockout-backup-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify({ stockOut: existingOut, stockIn: existingIn }, null, 2));
  console.log(`\n=== Backup ===`);
  console.log(`  ${existingOut.length} StockOut + ${existingIn.length} StockIn existing di-backup ke:`);
  console.log(`  ${file}`);
}

/** Mirror StockOutService.delete(): balikkan stok + remainingStock lalu hapus. */
async function reverseAndDeleteStockOut(tx: any, row: { id: string; productId: string; quantity: number }) {
  await tx.product.update({ where: { id: row.productId }, data: { stock: { increment: row.quantity } } });

  let qtyToRestore = row.quantity;
  const recentStockIns = await tx.stockIn.findMany({ where: { productId: row.productId }, orderBy: { entryDate: 'desc' } });
  for (const stIn of recentStockIns) {
    if (qtyToRestore <= 0) break;
    const spaceLeft = stIn.quantity - stIn.remainingStock;
    if (spaceLeft > 0) {
      const restoreAmount = Math.min(qtyToRestore, spaceLeft);
      await tx.stockIn.update({ where: { id: stIn.id }, data: { remainingStock: stIn.remainingStock + restoreAmount } });
      qtyToRestore -= restoreAmount;
    }
  }
  await tx.stockOut.delete({ where: { id: row.id } });
}

/** Mirror StockInService.delete(): balikkan stok lalu hapus. */
async function reverseAndDeleteStockIn(tx: any, row: { id: string; productId: string; quantity: number }) {
  await tx.product.update({ where: { id: row.productId }, data: { stock: { decrement: row.quantity } } });
  await tx.stockIn.delete({ where: { id: row.id } });
}

/** Mirror StockInService.create(): insert + increment Product.stock. */
async function insertStockIn(tx: any, row: StockInRow, productId: string, pricePerUnit: number) {
  const totalCost = row.quantity * pricePerUnit;
  await tx.stockIn.create({
    data: {
      productId,
      userId: SYSTEM_USER_ID,
      quantity: row.quantity,
      pricePerUnit,
      totalCost,
      supplier: SUPPLIER_NAME,
      entryDate: row.date,
      notes: 'Backfill histori Mei-Juli 2026 - data asli (lihat prisma/backfill-mei-jul-2026-exact.ts)',
      size: row.size,
      unitsPerPack: 0,
      pricePerSmallUnit: 0,
      remainingStock: row.quantity,
    },
  });
  await tx.product.update({ where: { id: productId }, data: { stock: { increment: row.quantity } } });
}

/** Mirror StockOutService.create(): FIFO deplete StockIn + insert + decrement Product.stock. */
async function insertStockOut(tx: any, row: StockOutRow, productId: string, pricePerUnit: number, docCounters: Record<string, number>) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Produk ${productId} tidak ditemukan saat insert`);

  const totalPrice = row.exitType === 'AGEN' ? pricePerUnit * row.quantity : 0;

  let qtyToDeplete = row.quantity;
  const availableStockIns = await tx.stockIn.findMany({
    where: { productId, remainingStock: { gt: 0 } },
    orderBy: { entryDate: 'asc' },
  });
  for (const stIn of availableStockIns) {
    if (qtyToDeplete <= 0) break;
    const depleteAmount = Math.min(qtyToDeplete, stIn.remainingStock);
    await tx.stockIn.update({ where: { id: stIn.id }, data: { remainingStock: stIn.remainingStock - depleteAmount } });
    qtyToDeplete -= depleteAmount;
  }

  const prefix = row.exitType === 'KULKAS' ? 'KLK' : row.exitType === 'SEDEKAH' ? 'SDK' : 'AGN';
  docCounters[row.exitType] = (docCounters[row.exitType] ?? 0) + 1;
  const documentNumber = `${prefix}-${String(docCounters[row.exitType]).padStart(3, '0')}`;

  await tx.stockOut.create({
    data: {
      productId,
      userId: SYSTEM_USER_ID,
      quantity: row.quantity,
      pricePerUnit,
      discountAmount: 0,
      totalPrice,
      buyerName: BUYER_NAME,
      exitDate: row.date,
      notes: 'Backfill histori Mei-Juli 2026 - data asli (lihat prisma/backfill-mei-jul-2026-exact.ts)',
      size: row.size,
      exitType: row.exitType,
      unitsPerPack: 0,
      pricePerSmallUnit: 0,
      productStockSnapshot: product.stock - row.quantity,
      documentNumber,
    },
  });

  await tx.product.update({ where: { id: productId }, data: { stock: { decrement: row.quantity } } });
}

let SYSTEM_USER_ID = '';

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (akan menulis ke DB)' : 'DRY RUN (baca-saja)'}`);
  console.log(`Rentang tanggal: ${rangeStart.toISOString().slice(0, 10)} s/d ${rangeEnd.toISOString().slice(0, 10)}`);
  console.log('Sumber data: Breakdown_Penjualan_Harian_Suti.xlsx (angka penjualan harian ASLI)');

  const stockOutPlan = buildStockOutPlan();
  const stockInPlan = buildStockInPlan();

  if (!APPLY) {
    await ensureProducts(prisma, false);
    printSummary(stockOutPlan, stockInPlan);
    console.log('\nDry run selesai. Tidak ada perubahan di database.');
    console.log('Kalau ringkasan di atas sudah sesuai, jalankan ulang dengan:');
    console.log('  npx tsx prisma/backfill-mei-jul-2026-exact.ts --apply --confirm=DELETE-MEI-JUL-2026-EXACT');
    return;
  }

  if (!CONFIRMED) {
    throw new Error('Mode --apply butuh flag konfirmasi eksplisit: tambahkan --confirm=DELETE-MEI-JUL-2026-EXACT');
  }

  const admin = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN'] } }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('Tidak ada user SUPER_ADMIN untuk dipakai sebagai userId pencatat backfill.');
  SYSTEM_USER_ID = admin.id;
  console.log(`\nMenggunakan user pencatat: ${admin.email} (${admin.id})`);

  const products = await prisma.$transaction(async (tx) => ensureProducts(tx, true), { timeout: 30_000 });
  printSummary(stockOutPlan, stockInPlan);

  const productIds = Object.values(products).map((p) => p.id);
  await backupExisting(productIds);

  // FASE 1: hapus SEMUA StockOut+StockIn lama untuk 2 produk ini di seluruh rentang
  // Mei-Juli sekaligus (bukan per bulan, dan tanpa peduli dibuat oleh script mana)
  // — supaya saat FASE 2 menghitung nomor dokumen baru per bulan, tidak ada baris
  // lama yang masih nyangkut dan bikin document_number baru bentrok.
  console.log('\n=== Fase 1: menghapus data lama di seluruh rentang Mei-Juli ===');
  await prisma.$transaction(
    async (tx) => {
      const oldOut = await tx.stockOut.findMany({ where: { exitDate: { gte: rangeStart, lte: rangeEnd }, productId: { in: productIds } } });
      console.log(`  Menghapus ${oldOut.length} StockOut lama...`);
      for (const row of oldOut) await reverseAndDeleteStockOut(tx, row);

      const oldIn = await tx.stockIn.findMany({ where: { entryDate: { gte: rangeStart, lte: rangeEnd }, productId: { in: productIds } } });
      console.log(`  Menghapus ${oldIn.length} StockIn lama...`);
      for (const row of oldIn) await reverseAndDeleteStockIn(tx, row);
    },
    { timeout: 120_000, maxWait: 20_000 }
  );

  // FASE 2: insert StockIn+StockOut baru per bulan (tabel sudah bersih dari data lama,
  // jadi count() untuk document_number sekarang aman/berurutan).
  for (const month of MONTHS) {
    const mStart = new Date(Date.UTC(YEAR, month - 1, 1));
    const mEnd = new Date(Date.UTC(YEAR, month, 0));
    console.log(`\n=== Memproses bulan ${month}/${YEAR} ===`);

    await prisma.$transaction(
      async (tx) => {
        const monthInRows = stockInPlan.filter((r) => r.date >= mStart && r.date <= mEnd);
        console.log(`  Menyisipkan ${monthInRows.length} StockIn baru...`);
        for (const row of monthInRows) {
          const product = products[row.size];
          if (!product) throw new Error(`Produk untuk ukuran "${row.size}" tidak ter-resolve`);
          const spec = PRODUCTS_TO_ENSURE.find((p) => p.size === row.size)!;
          await insertStockIn(tx, row, product.id, spec.priceBuy);
        }

        const monthOutRows = stockOutPlan.filter((r) => r.date >= mStart && r.date <= mEnd);
        console.log(`  Menyisipkan ${monthOutRows.length} StockOut baru...`);
        const docCounters: Record<string, number> = {};
        for (const type of ['AGEN', 'KULKAS', 'SEDEKAH']) {
          docCounters[type] = await tx.stockOut.count({ where: { exitType: type as StockOutType } });
        }
        for (const row of monthOutRows) {
          const product = products[row.size];
          if (!product) throw new Error(`Produk untuk ukuran "${row.size}" tidak ter-resolve`);
          await insertStockOut(tx, row, product.id, product.priceSell, docCounters);
        }
      },
      { timeout: 120_000, maxWait: 20_000 }
    );

    console.log(`  Bulan ${month}/${YEAR} selesai.`);
  }

  console.log('\nSelesai. StockIn + StockOut Mei-Juli 2026 sudah ditulis ulang dengan angka penjualan harian ASLI dari Excel.');
}

main()
  .catch((e) => {
    console.error('\nGAGAL:', e.message ?? e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
