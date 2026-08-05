/**
 * Backfill data barang masuk (StockIn) + barang keluar (StockOut) historis
 * Mei-Juli 2026, dengan stok saling terhubung normal (StockIn nambah stok,
 * StockOut kurangi stok via FIFO dari StockIn yang tersedia).
 *
 * RIWAYAT: run pertama script ini (lihat git history) cuma bikin 2 produk +
 * StockOut TANPA efek stok (karena waktu itu belum ada StockIn historis untuk
 * menopangnya). User lalu minta StockIn historis juga diisi dengan jumlah yang
 * SAMA PERSIS dengan StockOut per bulan/ukuran (barang masuk = barang terjual),
 * dan sekarang keduanya BOLEH saling mempengaruhi stok seperti alur normal
 * sistem. Script ini karena itu:
 *   1. Memastikan 2 produk ada (buat kalau belum, update priceBuy kalau beda
 *      dari konfigurasi — TIDAK PERNAH mengubah priceSell/stock produk yang
 *      sudah ada di luar efek StockIn/StockOut di bawah).
 *   2. Menghapus StockIn+StockOut historis punya 2 produk ini di rentang
 *      Mei-Juli 2026 kalau ada (idempotent — aman dijalankan ulang), sambil
 *      membalikkan efek stoknya dulu (mirror StockInService/StockOutService
 *      .delete()) sebelum dihapus.
 *   3. Insert StockIn baru: 1 baris per bulan per ukuran (6 baris), qty =
 *      total StockOut bulan itu, lalu increment Product.stock.
 *   4. Insert StockOut baru: sama seperti run pertama (harian, lonjakan Jumat
 *      2x, campuran AGEN/KULKAS/SEDEKAH 50/45/5) tapi kali ini FIFO deplete
 *      StockIn.remainingStock + decrement Product.stock, persis seperti alur
 *      normal StockOutService.create().
 *
 * CARA PAKAI:
 *   1. npx tsx prisma/backfill-mei-jul-2026.ts            -> DRY RUN (baca-saja, aman)
 *   2. Backup manual disarankan sebelum apply:
 *      docker exec suti-water_db_1 pg_dump -U <user> -d <db> -t products -t stock_in -t stock_out > backup.sql
 *      (script ini JUGA otomatis export JSON backup StockIn+StockOut yang mau dihapus)
 *   3. npx tsx prisma/backfill-mei-jul-2026.ts --apply --confirm=DELETE-MEI-JUL-2026
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

// Produk yang harus ada sebelum backfill jalan. Kalau produk dengan `name` ini
// sudah ada (match persis), priceBuy DI-UPDATE ke nilai di bawah (satu-satunya
// field yang boleh ditimpa pada produk existing); priceSell/stock tidak disentuh.
// Kalau belum ada, dibuat baru dengan semua nilai di bawah.
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

// Total dus per bulan per ukuran — dipakai SAMA untuk StockIn maupun StockOut
// (barang masuk = barang terjual, net stok tidak berubah dari histori ini).
const MONTHLY_TOTAL_BY_SIZE: Record<string, Record<number, number>> = {
  '200ml': { 5: 754, 6: 739, 7: 836 },
  '330ml': { 5: 1645, 6: 2148, 7: 2241 },
};

// Campuran jenis keluar (exit_type) untuk StockOut. Harus berjumlah 1.
const EXIT_TYPE_WEIGHTS: { type: StockOutType; weight: number }[] = [
  { type: 'AGEN', weight: 0.5 },
  { type: 'KULKAS', weight: 0.45 },
  { type: 'SEDEKAH', weight: 0.05 },
];

const FRIDAY_MULTIPLIER = 2.0; // "Jumat Berkah" ~2x rata-rata hari biasa
const BUYER_NAME: string | null = null;

const BACKUP_DIR = path.join(__dirname, '..', 'backup-stockout-mei-jul-2026');

/* ============================================================
 * SAFETY GATES — jangan diubah
 * ============================================================ */

const APPLY = process.argv.includes('--apply');
const CONFIRM_FLAG = process.argv.find((a) => a.startsWith('--confirm='));
const CONFIRMED = CONFIRM_FLAG === '--confirm=DELETE-MEI-JUL-2026';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rangeStart = new Date(Date.UTC(YEAR, MONTHS[0] - 1, 1));
const rangeEnd = new Date(Date.UTC(YEAR, MONTHS[MONTHS.length - 1], 0));

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isFriday(date: Date) {
  return date.getUTCDay() === 5;
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

function buildStockOutPlan(): StockOutRow[] {
  const exitWeightSum = EXIT_TYPE_WEIGHTS.reduce((a, b) => a + b.weight, 0);
  if (Math.abs(exitWeightSum - 1) > 1e-6) {
    throw new Error(`EXIT_TYPE_WEIGHTS harus berjumlah 1, saat ini ${exitWeightSum}`);
  }

  const plan: StockOutRow[] = [];
  for (const size of Object.keys(MONTHLY_TOTAL_BY_SIZE)) {
    for (const month of MONTHS) {
      const monthlyTotal = MONTHLY_TOTAL_BY_SIZE[size]?.[month] ?? 0;
      if (monthlyTotal === 0) continue;

      const nDays = daysInMonth(YEAR, month);
      const dates = Array.from({ length: nDays }, (_, i) => new Date(Date.UTC(YEAR, month - 1, i + 1)));
      const dayWeights = dates.map((d) => (isFriday(d) ? FRIDAY_MULTIPLIER : 1));
      const dailyQty = allocateInt(monthlyTotal, dayWeights);

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i]!;
        const dayTotal = dailyQty[i] ?? 0;
        if (dayTotal === 0) continue;

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
  for (const size of Object.keys(MONTHLY_TOTAL_BY_SIZE)) {
    for (const month of MONTHS) {
      const quantity = MONTHLY_TOTAL_BY_SIZE[size]?.[month] ?? 0;
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

  console.log('\n=== Ringkasan StockOut (barang keluar), setelah pembulatan ===');
  const byMonthSize: Record<string, number> = {};
  const byExitType: Record<string, number> = {};
  let fridayTotal = 0;
  let otherTotal = 0;
  let grandTotal = 0;

  for (const row of stockOutPlan) {
    const month = row.date.getUTCMonth() + 1;
    const key = `Bulan ${month} / ${row.size}`;
    byMonthSize[key] = (byMonthSize[key] ?? 0) + row.quantity;
    byExitType[row.exitType] = (byExitType[row.exitType] ?? 0) + row.quantity;
    if (isFriday(row.date)) fridayTotal += row.quantity; else otherTotal += row.quantity;
    grandTotal += row.quantity;
  }

  const target = Object.values(MONTHLY_TOTAL_BY_SIZE).reduce(
    (sum, byMonth) => sum + Object.values(byMonth).reduce((a, b) => a + b, 0),
    0
  );

  for (const [k, v] of Object.entries(byMonthSize)) console.log(`  ${k.padEnd(20)} : ${v} dus`);
  console.log('  ---');
  for (const [k, v] of Object.entries(byExitType)) console.log(`  exit_type ${k.padEnd(8)} : ${v} dus`);
  console.log('  ---');
  console.log(`  Total hari Jumat     : ${fridayTotal} dus`);
  console.log(`  Total hari lain      : ${otherTotal} dus`);
  console.log(`  GRAND TOTAL          : ${grandTotal} dus (target: ${target} dus)`);
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
      notes: 'Backfill histori Mei-Juli 2026 (lihat prisma/backfill-mei-jul-2026.ts)',
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
      notes: 'Backfill histori Mei-Juli 2026 (lihat prisma/backfill-mei-jul-2026.ts)',
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

  const stockOutPlan = buildStockOutPlan();
  const stockInPlan = buildStockInPlan();

  if (!APPLY) {
    await ensureProducts(prisma, false);
    printSummary(stockOutPlan, stockInPlan);
    console.log('\nDry run selesai. Tidak ada perubahan di database.');
    console.log('Kalau ringkasan di atas sudah sesuai, jalankan ulang dengan:');
    console.log('  npx tsx prisma/backfill-mei-jul-2026.ts --apply --confirm=DELETE-MEI-JUL-2026');
    return;
  }

  if (!CONFIRMED) {
    throw new Error('Mode --apply butuh flag konfirmasi eksplisit: tambahkan --confirm=DELETE-MEI-JUL-2026');
  }

  const admin = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN'] } }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('Tidak ada user SUPER_ADMIN untuk dipakai sebagai userId pencatat backfill.');
  SYSTEM_USER_ID = admin.id;
  console.log(`\nMenggunakan user pencatat: ${admin.email} (${admin.id})`);

  const products = await prisma.$transaction(async (tx) => ensureProducts(tx, true), { timeout: 30_000 });
  printSummary(stockOutPlan, stockInPlan);

  const productIds = Object.values(products).map((p) => p.id);
  await backupExisting(productIds);

  for (const month of MONTHS) {
    const mStart = new Date(Date.UTC(YEAR, month - 1, 1));
    const mEnd = new Date(Date.UTC(YEAR, month, 0));
    console.log(`\n=== Memproses bulan ${month}/${YEAR} ===`);

    await prisma.$transaction(
      async (tx) => {
        // 1) Hapus StockOut lama bulan ini (kalau ada, dari run sebelumnya) — reverse dulu
        const oldOut = await tx.stockOut.findMany({ where: { exitDate: { gte: mStart, lte: mEnd }, productId: { in: productIds } } });
        console.log(`  Menghapus ${oldOut.length} StockOut lama...`);
        for (const row of oldOut) await reverseAndDeleteStockOut(tx, row);

        // 2) Hapus StockIn lama bulan ini (kalau ada) — reverse dulu
        const oldIn = await tx.stockIn.findMany({ where: { entryDate: { gte: mStart, lte: mEnd }, productId: { in: productIds } } });
        console.log(`  Menghapus ${oldIn.length} StockIn lama...`);
        for (const row of oldIn) await reverseAndDeleteStockIn(tx, row);

        // 3) Insert StockIn bulan ini
        const monthInRows = stockInPlan.filter((r) => r.date >= mStart && r.date <= mEnd);
        console.log(`  Menyisipkan ${monthInRows.length} StockIn baru...`);
        for (const row of monthInRows) {
          const product = products[row.size];
          if (!product) throw new Error(`Produk untuk ukuran "${row.size}" tidak ter-resolve`);
          const spec = PRODUCTS_TO_ENSURE.find((p) => p.size === row.size)!;
          await insertStockIn(tx, row, product.id, spec.priceBuy);
        }

        // 4) Insert StockOut bulan ini (FIFO deplete StockIn di atas)
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

  console.log('\nSelesai. StockIn + StockOut Mei-Juli 2026 sudah ditulis ulang dengan stok saling terhubung normal.');
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
