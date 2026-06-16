// Cermin dari apps/web/src/lib/water-sizes.ts — JAGA AGAR SINKRON.
// Daftar ukuran kemasan yang dipakai untuk tag per-transaksi StockIn/StockOut.
// Diselaraskan dengan katalog produk Suti yang ada (Gelas 240ml, Botol 600ml/1500ml, Galon).
export const WATER_SIZES = ['240ml', '600ml', '1500ml', 'Galon'] as const;
export type WaterSize = (typeof WATER_SIZES)[number];
