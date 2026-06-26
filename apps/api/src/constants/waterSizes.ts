// Cermin dari apps/web/src/lib/water-sizes.ts — JAGA AGAR SINKRON.
// Daftar ukuran kemasan yang dipakai untuk tag per-transaksi StockIn/StockOut.
// Diselaraskan dengan katalog produk Suti yang ada (Gelas 220ml, Botol 330ml/550ml/600ml, Galon).
export const WATER_SIZES = ['220ml', '330ml', '550ml', '600ml', 'Galon'] as const;
export type WaterSize = (typeof WATER_SIZES)[number];
