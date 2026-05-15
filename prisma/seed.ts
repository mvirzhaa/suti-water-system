import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper: buat Date di bulan tertentu tahun ini
const dateOf = (month: number, day: number) => {
  const year = new Date().getFullYear();
  return new Date(year, month - 1, day);
};

// ─── URL gambar produk ────────────────────────────────────────────────────────
// Ganti dengan URL Cloudinary atau path lokal setelah upload foto produk asli
// Contoh Cloudinary: 'https://res.cloudinary.com/dev3qabx0/image/upload/v.../galon.png'
// Contoh lokal (taruh foto di apps/web/public/images/): '/images/produk-galon.png'

const IMG_GALON  = '/images/produk-galon.png';   // ← ganti dengan URL foto galon asli
const IMG_BOTOL  = '/images/produk-botol.png';   // ← ganti dengan URL foto botol asli
const IMG_GELAS  = '/images/produk-gelas.png';   // ← ganti dengan URL foto gelas asli

async function main() {
  console.log('🌱 Seeding database Suti Water System...');

  // ─────────────────────────────────────────
  // 1. USERS
  // ─────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@suti.com' },
    update: {},
    create: { email: 'admin@suti.com', name: 'Super Admin Suti', password: hash, role: Role.SUPER_ADMIN },
  });

  await prisma.user.upsert({
    where: { email: 'pimpinan@suti.com' },
    update: {},
    create: { email: 'pimpinan@suti.com', name: 'Pimpinan Suti', password: hash, role: Role.PIMPINAN },
  });

  // Staff dihitung sebagai "total agen" di KPI dashboard
  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@suti.com' },
    update: {},
    create: { email: 'staff1@suti.com', name: 'Budi Santoso', password: hash, role: Role.STAFF },
  });
  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@suti.com' },
    update: {},
    create: { email: 'staff2@suti.com', name: 'Siti Rahayu', password: hash, role: Role.STAFF },
  });
  const staff3 = await prisma.user.upsert({
    where: { email: 'staff3@suti.com' },
    update: {},
    create: { email: 'staff3@suti.com', name: 'Ahmad Fauzi', password: hash, role: Role.STAFF },
  });

  console.log('✅ Users: admin@suti.com, pimpinan@suti.com, staff1-3@suti.com (password: password123)');

  // ─────────────────────────────────────────
  // 2. CATEGORIES
  // ─────────────────────────────────────────
  const catGalon = await prisma.category.upsert({
    where: { slug: 'air-galon' },
    update: {},
    create: { name: 'Air Mineral Galon', slug: 'air-galon', icon: 'drum' },
  });
  const catKardus = await prisma.category.upsert({
    where: { slug: 'air-kardus' },
    update: {},
    create: { name: 'Air Mineral Kardus', slug: 'air-kardus', icon: 'box' },
  });
  const catGelas = await prisma.category.upsert({
    where: { slug: 'air-gelas' },
    update: {},
    create: { name: 'Air Mineral Gelas', slug: 'air-gelas', icon: 'cup' },
  });

  console.log('✅ Categories created');

  // ─────────────────────────────────────────
  // 3. PRODUCTS
  // ─────────────────────────────────────────
  const prodGalon19 = await prisma.product.upsert({
    where: { sku: 'GAL-19L' },
    update: { imageUrl: IMG_GALON },
    create: {
      name: 'Suti Water Galon 19L', sku: 'GAL-19L',
      categoryId: catGalon.id, unit: 'Galon',
      priceBuy: 12000, priceSell: 18000,
      stock: 120, minStock: 20,
      imageUrl: IMG_GALON,
      createdBy: superAdmin.id,
    },
  });

  const prodKardus240 = await prisma.product.upsert({
    where: { sku: 'KRD-240' },
    update: { imageUrl: IMG_GELAS },
    create: {
      name: 'Suti Water Gelas 220ml', sku: 'KRD-240',
      categoryId: catGelas.id, unit: 'Kardus',
      priceBuy: 15000, priceSell: 20000,
      stock: 85, minStock: 15,
      imageUrl: IMG_GELAS,
      createdBy: superAdmin.id,
    },
  });

  const prodKardus600 = await prisma.product.upsert({
    where: { sku: 'KRD-600' },
    update: { imageUrl: IMG_BOTOL },
    create: {
      name: 'Suti Water Botol 600ml', sku: 'KRD-600',
      categoryId: catKardus.id, unit: 'Kardus',
      priceBuy: 28000, priceSell: 35000,
      stock: 60, minStock: 10,
      imageUrl: IMG_BOTOL,
      createdBy: superAdmin.id,
    },
  });

  const prodGalon5 = await prisma.product.upsert({
    where: { sku: 'GAL-5L' },
    update: { imageUrl: IMG_GALON },
    create: {
      name: 'Suti Water Galon 5L', sku: 'GAL-5L',
      categoryId: catGalon.id, unit: 'Galon',
      priceBuy: 5000, priceSell: 8000,
      stock: 4, minStock: 10,
      imageUrl: IMG_GALON,
      createdBy: superAdmin.id,
    },
  });

  const prodKardus1500 = await prisma.product.upsert({
    where: { sku: 'KRD-1500' },
    update: { imageUrl: IMG_BOTOL },
    create: {
      name: 'Suti Water Botol 1500ml', sku: 'KRD-1500',
      categoryId: catKardus.id, unit: 'Kardus',
      priceBuy: 35000, priceSell: 45000,
      stock: 3, minStock: 8,
      imageUrl: IMG_BOTOL,
      createdBy: superAdmin.id,
    },
  });

  console.log('✅ Products created (2 low-stock items)');

  // ─────────────────────────────────────────
  // 4. SUPPLIERS
  // ─────────────────────────────────────────
  const sup1 = await prisma.supplier.create({
    data: {
      name: 'CV. Lumbung Toda',
      phone: '0877-7004-2820',
      address: 'Sindang Barang RT 04/04, Pasireurih, Kec. Tamansari, Kab. Bogor, Jawa Barat 16610',
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      name: 'PT. Sumber Air Bersih',
      phone: '021-5551234',
      address: 'Jl. Industri No. 12, Kawasan Industri Pulogadung, Jakarta Timur 13920',
    },
  });

  console.log('✅ Suppliers created');

  // ─────────────────────────────────────────
  // 5. AGENTS
  // ─────────────────────────────────────────
  await prisma.agent.createMany({
    data: [
      { name: 'Yayasan Islam Al-Qudwah', pic: 'H. Nurjaya, M.Pd.', phone: '021-7758033', address: 'Jl. Beringin No. 01, Kemiri Muka, Beji, Depok 16423' },
      { name: 'Toserba Maju Jaya', pic: 'Dr. Sofyan Basyir, SE.', phone: '0811-1226-242', address: 'Jl. RE. Martadinata No. 42, Ciwaringin, Bogor Tengah 16124' },
      { name: 'SMPIT Darul Quran Mulia', pic: 'Bpk. Jauhari', phone: '0812-8882-9847', address: 'Jl. Raya Puspitek, Kp. Cikarang, Pabuaran, Bogor' },
      { name: 'Cahaya Mart', pic: 'H. Dwi Sudharto, M.Si', phone: '0852-1042-3279', address: 'Jl. Perdana Raya No. 22, Kedungbadak, Tanah Sereal, Bogor 16710' },
    ],
  });

  console.log('✅ Agents created');

  // ─────────────────────────────────────────
  // 6. DISCOUNTS
  // ─────────────────────────────────────────
  const discount = await prisma.discount.create({
    data: {
      name: 'Diskon Pembelian Terbanyak',
      description: 'Diskon 8% untuk pembelian minimal 500 unit',
      type: 'PERCENTAGE',
      value: 8,
      applicableTo: 'ALL',
      minQuantity: 500,
      startDate: dateOf(1, 1),
      endDate: dateOf(12, 31),
      isActive: true,
      createdBy: superAdmin.id,
    },
  });

  console.log('✅ Discounts created');

  // ─────────────────────────────────────────
  // 7. STOCK IN — tersebar di beberapa bulan (untuk chart)
  // ─────────────────────────────────────────
  const stockInData = [
    // Bulan 1 (Januari)
    { productId: prodGalon19.id, supplierId: sup1.id, quantity: 200, pricePerUnit: 12000, entryDate: dateOf(1, 5) },
    { productId: prodKardus240.id, supplierId: sup2.id, quantity: 150, pricePerUnit: 15000, entryDate: dateOf(1, 10) },
    // Bulan 2 (Februari)
    { productId: prodGalon19.id, supplierId: sup1.id, quantity: 180, pricePerUnit: 12000, entryDate: dateOf(2, 8) },
    { productId: prodKardus600.id, supplierId: sup2.id, quantity: 100, pricePerUnit: 28000, entryDate: dateOf(2, 15) },
    // Bulan 3 (Maret)
    { productId: prodGalon19.id, supplierId: sup1.id, quantity: 250, pricePerUnit: 12000, entryDate: dateOf(3, 3) },
    { productId: prodKardus240.id, supplierId: sup2.id, quantity: 200, pricePerUnit: 15000, entryDate: dateOf(3, 20) },
    { productId: prodKardus1500.id, supplierId: sup2.id, quantity: 80, pricePerUnit: 35000, entryDate: dateOf(3, 25) },
    // Bulan 4 (April)
    { productId: prodGalon19.id, supplierId: sup1.id, quantity: 300, pricePerUnit: 12000, entryDate: dateOf(4, 2) },
    { productId: prodKardus600.id, supplierId: sup2.id, quantity: 120, pricePerUnit: 28000, entryDate: dateOf(4, 18) },
    // Bulan 5 (Mei)
    { productId: prodGalon19.id, supplierId: sup1.id, quantity: 220, pricePerUnit: 12000, entryDate: dateOf(5, 5) },
    { productId: prodKardus240.id, supplierId: sup2.id, quantity: 180, pricePerUnit: 15000, entryDate: dateOf(5, 12) },
    { productId: prodGalon5.id, supplierId: sup1.id, quantity: 60, pricePerUnit: 5000, entryDate: dateOf(5, 20) },
  ];

  for (const item of stockInData) {
    await prisma.stockIn.create({
      data: {
        productId: item.productId,
        userId: staff1.id,
        supplierId: item.supplierId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalCost: item.quantity * item.pricePerUnit,
        entryDate: item.entryDate,
      },
    });
  }

  console.log('✅ Stock-in records created (6 months of data)');

  // ─────────────────────────────────────────
  // 8. STOCK OUT — tersebar di beberapa bulan + top buyers
  // ─────────────────────────────────────────
  // Nama pembeli yang akan muncul di "Top Buyers"
  const buyers = [
    'Yayasan Islam Al-Qudwah',
    'Toserba Maju Jaya',
    'SMPIT Darul Quran Mulia',
    'Cahaya Mart',
    'Toko Berkah Mandiri',
  ];

  const stockOutData = [
    // Bulan 1
    { productId: prodGalon19.id, buyerName: buyers[0], quantity: 80, pricePerUnit: 18000, exitDate: dateOf(1, 8) },
    { productId: prodKardus240.id, buyerName: buyers[1], quantity: 60, pricePerUnit: 20000, exitDate: dateOf(1, 12) },
    { productId: prodKardus600.id, buyerName: buyers[2], quantity: 40, pricePerUnit: 35000, exitDate: dateOf(1, 20) },
    // Bulan 2
    { productId: prodGalon19.id, buyerName: buyers[0], quantity: 100, pricePerUnit: 18000, exitDate: dateOf(2, 5) },
    { productId: prodKardus240.id, buyerName: buyers[3], quantity: 75, pricePerUnit: 20000, exitDate: dateOf(2, 14) },
    { productId: prodGalon19.id, buyerName: buyers[1], quantity: 50, pricePerUnit: 18000, exitDate: dateOf(2, 22) },
    // Bulan 3
    { productId: prodGalon19.id, buyerName: buyers[0], quantity: 120, pricePerUnit: 18000, exitDate: dateOf(3, 7) },
    { productId: prodKardus600.id, buyerName: buyers[2], quantity: 55, pricePerUnit: 35000, exitDate: dateOf(3, 15) },
    { productId: prodKardus240.id, buyerName: buyers[4], quantity: 90, pricePerUnit: 20000, exitDate: dateOf(3, 28) },
    // Bulan 4
    { productId: prodGalon19.id, buyerName: buyers[1], quantity: 110, pricePerUnit: 18000, exitDate: dateOf(4, 3) },
    { productId: prodKardus240.id, buyerName: buyers[0], quantity: 80, pricePerUnit: 20000, exitDate: dateOf(4, 10) },
    { productId: prodKardus600.id, buyerName: buyers[3], quantity: 45, pricePerUnit: 35000, exitDate: dateOf(4, 25) },
    // Bulan 5 (bulan ini — untuk KPI pendapatan bulan ini)
    { productId: prodGalon19.id, buyerName: buyers[0], quantity: 150, pricePerUnit: 18000, exitDate: dateOf(5, 2) },
    { productId: prodKardus240.id, buyerName: buyers[1], quantity: 100, pricePerUnit: 20000, exitDate: dateOf(5, 8) },
    { productId: prodGalon19.id, buyerName: buyers[2], quantity: 70, pricePerUnit: 18000, exitDate: dateOf(5, 14) },
    { productId: prodKardus600.id, buyerName: buyers[4], quantity: 60, pricePerUnit: 35000, exitDate: dateOf(5, 18) },
    { productId: prodGalon19.id, buyerName: buyers[3], quantity: 90, pricePerUnit: 18000, exitDate: dateOf(5, 22) },
  ];

  for (const item of stockOutData) {
    const totalPrice = item.quantity * item.pricePerUnit;
    await prisma.stockOut.create({
      data: {
        productId: item.productId,
        userId: staff2.id,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        discountAmount: 0,
        totalPrice,
        buyerName: item.buyerName,
        exitDate: item.exitDate,
      },
    });
  }

  console.log('✅ Stock-out records created (5 months, 5 top buyers)');

  // ─────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────
  console.log('\n✨ Seeding selesai! Akun login:');
  console.log('   👑 Super Admin : admin@suti.com     / password123');
  console.log('   🎯 Pimpinan    : pimpinan@suti.com  / password123');
  console.log('   👷 Staff 1     : staff1@suti.com    / password123');
  console.log('   👷 Staff 2     : staff2@suti.com    / password123');
  console.log('   👷 Staff 3     : staff3@suti.com    / password123');
  console.log('\n📊 Dashboard akan menampilkan:');
  console.log('   - KPI: 3 staff, total stok semua produk, pendapatan bulan Mei');
  console.log('   - Chart: data 5 bulan (Jan–Mei)');
  console.log('   - Top buyers: 5 pembeli dengan qty terbanyak');
  console.log('   - Top products: Galon 19L & Gelas 240ml terlaris');
  console.log('   - Low stock: Galon 5L (stok 4, min 10) & Botol 1500ml (stok 3, min 8)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
