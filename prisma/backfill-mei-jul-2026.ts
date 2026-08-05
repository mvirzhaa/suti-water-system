/**
 * Backfill data penjualan historis Mei-Juli 2026 ke StockOut.
 *
 * LATAR BELAKANG: total penjualan lama dicatat per kategori "200ml"/"330ml" yang
 * TIDAK cocok dengan ukuran katalog saat ini (220ml/330ml/550ml/600ml/Galon).
 * Atas instruksi user: total-kan semua angka lama, hapus seluruh StockOut periode
 * Mei-Juli yang ada sekarang (apapun ukurannya), lalu tulis ulang dari nol dibagi
 * ke 5 ukuran sistem saat ini, dengan lonjakan volume di setiap hari Jumat
 * ("Jumat Berkah").
 *
 * CARA PAKAI:
 *   1. npx tsx prisma/backfill-mei-jul-2026.ts            -> DRY RUN (baca-saja, aman)
 *      Review output: mapping produk per ukuran, ringkasan angka per bulan/ukuran.
 *      Kalau ada ukuran dengan produk ambigu/tidak ketemu, isi PRODUCT_ID_OVERRIDE
 *      di bawah lalu jalankan dry run lagi sampai bersih.
 *   2. Backup manual dulu (di luar script ini) sebelum apply, mis:
 *      pg_dump "$DATABASE_URL" -t stock_outs -t products -t stock_ins > backup.sql
 *      (script ini JUGA otomatis export JSON backup StockOut yang mau dihapus,
 *      tapi pg_dump manual tetap disarankan untuk jaring pengaman penuh)
 *   3. npx tsx prisma/backfill-mei-jul-2026.ts --apply --confirm=DELETE-MEI-JUL-2026
 *      -> BENERAN menghapus StockOut Mei-Juli 2026 (semua ukuran) lalu insert ulang.
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

// Total penjualan per bulan = gabungan kategori lama "200ml" + "330ml".
// (Mei: 754+1645, Juni: 739+2148, Juli: 836+2241 — total keseluruhan 8.363 pcs)
const MONTHLY_TOTAL: Record<number, number> = {
  5: 754 + 1645,
  6: 739 + 2148,
  7: 836 + 2241,
};

// Bobot pembagian total ke ukuran katalog saat ini. Harus berjumlah 1.
const SIZE_WEIGHTS: Record<string, number> = {
  '220ml': 0.30,
  '330ml': 0.40,
  '550ml': 0.15,
  '600ml': 0.10,
  Galon: 0.05,
};

// Pola pencarian produk aktif per ukuran (ILIKE terhadap products.name).
const SIZE_NAME_PATTERN: Record<string, string> = {
  '220ml': '%220ml%',
  '330ml': '%330ml%',
  '550ml': '%550ml%',
  '600ml': '%600ml%',
  Galon: '%galon%',
};

// ISI MANUAL kalau dry-run melaporkan ukuran dengan produk ambigu (>1 match)
// atau tidak ketemu (0 match). Contoh: { '600ml': 'uuid-produk-600ml-kardus' }
const PRODUCT_ID_OVERRIDE: Partial<Record<string, string>> = {};

// Campuran jenis keluar (exit_type). Harus berjumlah 1.
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
const rangeEnd = new Date(Date.UTC(YEAR, MONTHS[MONTHS.length - 1], 0)); // last day of last month

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

async function resolveProductForSize(size: string): Promise<{ id: string; name: string; stock: number; priceSell: string }> {
  const override = PRODUCT_ID_OVERRIDE[size];
  if (override) {
    const p = await prisma.product.findUnique({ where: { id: override } });
    if (!p || p.deletedAt || !p.isActive) {
      throw new Error(`PRODUCT_ID_OVERRIDE untuk "${size}" (${override}) tidak valid/aktif.`);
    }
    return { id: p.id, name: p.name, stock: p.stock, priceSell: p.priceSell.toString() };
  }

  const pattern = SIZE_NAME_PATTERN[size];
  if (!pattern) throw new Error(`SIZE_NAME_PATTERN tidak punya entri untuk ukuran "${size}"`);
  const matches = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, name: { contains: pattern.replace(/%/g, ''), mode: 'insensitive' } },
  });

  if (matches.length === 0) {
    throw new Error(
      `Tidak ada produk aktif yang cocok untuk ukuran "${size}" (pola "${pattern}"). ` +
      `Isi PRODUCT_ID_OVERRIDE['${size}'] secara manual.`
    );
  }
  if (matches.length > 1) {
    const names = matches.map((m) => `  - ${m.id}  ${m.name}`).join('\n');
    throw new Error(
      `Ada ${matches.length} produk aktif yang cocok untuk ukuran "${size}", ambigu:\n${names}\n` +
      `Isi PRODUCT_ID_OVERRIDE['${size}'] dengan salah satu id di atas.`
    );
  }
  const p = matches[0]!;
  return { id: p.id, name: p.name, stock: p.stock, priceSell: p.priceSell.toString() };
}

interface PlannedRow {
  date: Date;
  size: string;
  productId: string;
  productName: string;
  exitType: StockOutType;
  quantity: number;
  pricePerUnit: number;
}

async function buildPlan(): Promise<PlannedRow[]> {
  const sizeKeys = Object.keys(SIZE_WEIGHTS);
  const sizeWeightSum = Object.values(SIZE_WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(sizeWeightSum - 1) > 1e-6) {
    throw new Error(`SIZE_WEIGHTS harus berjumlah 1, saat ini ${sizeWeightSum}`);
  }
  const exitWeightSum = EXIT_TYPE_WEIGHTS.reduce((a, b) => a + b.weight, 0);
  if (Math.abs(exitWeightSum - 1) > 1e-6) {
    throw new Error(`EXIT_TYPE_WEIGHTS harus berjumlah 1, saat ini ${exitWeightSum}`);
  }

  const products: Record<string, { id: string; name: string; priceSell: string }> = {};
  console.log('\n=== Resolusi produk per ukuran ===');
  for (const size of sizeKeys) {
    const p = await resolveProductForSize(size);
    products[size] = p;
    console.log(`  ${size.padEnd(6)} -> [${p.id}] ${p.name}  (harga jual saat ini: ${p.priceSell})`);
  }

  const plan: PlannedRow[] = [];

  for (const month of MONTHS) {
    const nDays = daysInMonth(YEAR, month);
    const dates = Array.from({ length: nDays }, (_, i) => new Date(Date.UTC(YEAR, month - 1, i + 1)));
    const dayWeights = dates.map((d) => (isFriday(d) ? FRIDAY_MULTIPLIER : 1));
    const monthlyTotal = MONTHLY_TOTAL[month] ?? 0;
    const dailyQty = allocateInt(monthlyTotal, dayWeights);

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]!;
      const dayTotal = dailyQty[i] ?? 0;
      if (dayTotal === 0) continue;
      const sizeQty = allocateInt(dayTotal, sizeKeys.map((s) => SIZE_WEIGHTS[s] ?? 0));

      for (let s = 0; s < sizeKeys.length; s++) {
        const size = sizeKeys[s]!;
        const qtyForSize = sizeQty[s] ?? 0;
        if (qtyForSize === 0) continue;
        const exitQty = allocateInt(qtyForSize, EXIT_TYPE_WEIGHTS.map((e) => e.weight));

        for (let e = 0; e < EXIT_TYPE_WEIGHTS.length; e++) {
          const qty = exitQty[e] ?? 0;
          if (qty === 0) continue;
          const product = products[size];
          if (!product) throw new Error(`Produk untuk ukuran "${size}" belum ter-resolve`);
          const exitTypeEntry = EXIT_TYPE_WEIGHTS[e]!;
          plan.push({
            date,
            size,
            productId: product.id,
            productName: product.name,
            exitType: exitTypeEntry.type,
            quantity: qty,
            pricePerUnit: Number(product.priceSell),
          });
        }
      }
    }
  }

  return plan;
}

function printSummary(plan: PlannedRow[]) {
  console.log('\n=== Ringkasan rencana insert (setelah pembulatan) ===');
  const byMonthSize: Record<string, number> = {};
  const byExitType: Record<string, number> = {};
  let fridayTotal = 0;
  let otherTotal = 0;
  let grandTotal = 0;

  for (const row of plan) {
    const month = row.date.getUTCMonth() + 1;
    const key = `Bulan ${month} / ${row.size}`;
    byMonthSize[key] = (byMonthSize[key] ?? 0) + row.quantity;
    byExitType[row.exitType] = (byExitType[row.exitType] ?? 0) + row.quantity;
    if (isFriday(row.date)) fridayTotal += row.quantity; else otherTotal += row.quantity;
    grandTotal += row.quantity;
  }

  for (const [k, v] of Object.entries(byMonthSize)) console.log(`  ${k.padEnd(20)} : ${v}`);
  console.log('  ---');
  for (const [k, v] of Object.entries(byExitType)) console.log(`  exit_type ${k.padEnd(8)} : ${v}`);
  console.log('  ---');
  console.log(`  Total hari Jumat     : ${fridayTotal}`);
  console.log(`  Total hari lain      : ${otherTotal}`);
  console.log(`  GRAND TOTAL          : ${grandTotal} (target: ${Object.values(MONTHLY_TOTAL).reduce((a, b) => a + b, 0)})`);
  console.log(`  Jumlah baris StockOut yang akan dibuat: ${plan.length}`);
}

async function backupExisting() {
  const existing = await prisma.stockOut.findMany({
    where: { exitDate: { gte: rangeStart, lte: rangeEnd } },
    include: { product: { select: { name: true } } },
  });

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `stockout-backup-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  console.log(`\n=== Backup ===`);
  console.log(`  ${existing.length} baris StockOut existing (periode ${rangeStart.toISOString().slice(0, 10)}..${rangeEnd.toISOString().slice(0, 10)}) di-backup ke:`);
  console.log(`  ${file}`);
  return existing;
}

/** Balikkan efek stok satu StockOut (mirror StockOutService.delete) lalu hapus barisnya. */
async function reverseAndDeleteStockOut(tx: any, stockOut: { id: string; productId: string; quantity: number }) {
  await tx.product.update({
    where: { id: stockOut.productId },
    data: { stock: { increment: stockOut.quantity } },
  });

  let qtyToRestore = stockOut.quantity;
  const recentStockIns = await tx.stockIn.findMany({
    where: { productId: stockOut.productId },
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

  await tx.stockOut.delete({ where: { id: stockOut.id } });
}

/** Insert satu StockOut baru (mirror StockOutService.create, tanpa validasi HTTP/discount). */
async function insertStockOut(tx: any, row: PlannedRow, docCounters: Record<string, number>) {
  const product = await tx.product.findUnique({ where: { id: row.productId } });
  if (!product) throw new Error(`Produk ${row.productId} tidak ditemukan saat insert`);

  const totalPrice = row.exitType === 'AGEN' ? row.pricePerUnit * row.quantity : 0;

  let qtyToDeplete = row.quantity;
  const availableStockIns = await tx.stockIn.findMany({
    where: { productId: row.productId, remainingStock: { gt: 0 } },
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
  // Catatan: kalau stok masuk historis tidak cukup untuk menutupi kuantitas ini,
  // sisanya (qtyToDeplete > 0) tidak dikurangkan dari StockIn manapun — sama seperti
  // batasan FIFO yang sudah ada di sistem, bukan hal baru yang diperkenalkan script ini.

  const prefix = row.exitType === 'KULKAS' ? 'KLK' : row.exitType === 'SEDEKAH' ? 'SDK' : 'AGN';
  docCounters[row.exitType] = (docCounters[row.exitType] ?? 0) + 1;
  const documentNumber = `${prefix}-${String(docCounters[row.exitType]).padStart(3, '0')}`;

  await tx.stockOut.create({
    data: {
      productId: row.productId,
      userId: SYSTEM_USER_ID,
      quantity: row.quantity,
      pricePerUnit: row.pricePerUnit,
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

  await tx.product.update({
    where: { id: row.productId },
    data: { stock: { decrement: row.quantity } },
  });
}

let SYSTEM_USER_ID = '';

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (akan menulis ke DB)' : 'DRY RUN (baca-saja)'}`);
  console.log(`Rentang tanggal: ${rangeStart.toISOString().slice(0, 10)} s/d ${rangeEnd.toISOString().slice(0, 10)}`);

  const plan = await buildPlan();
  printSummary(plan);

  if (!APPLY) {
    console.log('\nDry run selesai. Tidak ada perubahan di database.');
    console.log('Kalau ringkasan di atas sudah sesuai, jalankan ulang dengan:');
    console.log('  npx tsx prisma/backfill-mei-jul-2026.ts --apply --confirm=DELETE-MEI-JUL-2026');
    return;
  }

  if (!CONFIRMED) {
    throw new Error(
      'Mode --apply butuh flag konfirmasi eksplisit: tambahkan --confirm=DELETE-MEI-JUL-2026 ' +
      'agar tidak terhapus tidak sengaja.'
    );
  }

  const admin = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN'] } }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('Tidak ada user SUPER_ADMIN untuk dipakai sebagai userId pencatat backfill.');
  SYSTEM_USER_ID = admin.id;
  console.log(`\nMenggunakan user pencatat: ${admin.email} (${admin.id})`);

  await backupExisting();

  for (const month of MONTHS) {
    const mStart = new Date(Date.UTC(YEAR, month - 1, 1));
    const mEnd = new Date(Date.UTC(YEAR, month, 0));
    console.log(`\n=== Memproses bulan ${month}/${YEAR} ===`);

    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.stockOut.findMany({
          where: { exitDate: { gte: mStart, lte: mEnd } },
        });
        console.log(`  Menghapus ${existing.length} StockOut lama...`);
        for (const row of existing) {
          await reverseAndDeleteStockOut(tx, row);
        }

        const monthRows = plan.filter((r) => r.date >= mStart && r.date <= mEnd);
        console.log(`  Menyisipkan ${monthRows.length} StockOut baru...`);
        const docCounters: Record<string, number> = {};
        for (const type of ['AGEN', 'KULKAS', 'SEDEKAH']) {
          docCounters[type] = await tx.stockOut.count({ where: { exitType: type as StockOutType } });
        }
        for (const row of monthRows) {
          await insertStockOut(tx, row, docCounters);
        }
      },
      { timeout: 120_000, maxWait: 20_000 }
    );

    console.log(`  Bulan ${month}/${YEAR} selesai.`);
  }

  console.log('\nSelesai. Semua StockOut Mei-Juli 2026 sudah ditulis ulang.');
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
