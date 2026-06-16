// Satu-satunya tempat mengubah daftar ukuran kemasan (frontend).
// Mengubah daftar di sini otomatis mengubah radio input & filter laporan.
// Diselaraskan dengan katalog produk Suti (Gelas 240ml, Botol 600ml/1500ml, Galon).
// PENTING: jaga sinkron dengan apps/api/src/constants/waterSizes.ts.
export const WATER_SIZES = ['240ml', '600ml', '1500ml', 'Galon'] as const;
export type WaterSize = (typeof WATER_SIZES)[number];

// Nilai khusus untuk filter laporan "semua ukuran".
export const SIZE_ALL = 'ALL' as const;
export type SizeFilter = typeof SIZE_ALL | WaterSize;

// Opsi untuk filter laporan (Keseluruhan + tiap ukuran).
export const SIZE_OPTIONS: { label: string; value: SizeFilter }[] = [
  { label: 'Keseluruhan', value: SIZE_ALL },
  ...WATER_SIZES.map((s) => ({ label: s, value: s as SizeFilter })),
];
