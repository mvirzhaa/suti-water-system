import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dateOf = (month: number, day: number) => {
  const year = new Date().getFullYear();
  return new Date(year, month - 1, day);
};

const IMG_GALON  = '/images/produk-galon.png';
const IMG_BOTOL  = '/images/produk-botol.png';
const IMG_GELAS  = '/images/produk-gelas.png';
const IMG_KULKAS = 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=400&h=300&fit=crop';

async function main() {
  console.log('🌱 Menghapus data lama (kecuali User)...');
  
  // Hapus data secara berurutan sesuai relasi
  await prisma.kulkasRekapLine.deleteMany();
  await prisma.kulkasRekapShare.deleteMany();
  await prisma.kulkasRekap.deleteMany();
  
  await prisma.refrigeratorReportShare.deleteMany();
  await prisma.refrigeratorWeeklyReport.deleteMany();
  
  await prisma.refrigeratorFill.deleteMany();
  await prisma.refrigeratorShare.deleteMany();
  await prisma.refrigerator.deleteMany();

  await prisma.stockOut.deleteMany();
  await prisma.stockIn.deleteMany();
  await prisma.discountProduct.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.product.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  
  // Refresh Token & Audit Log kita hapus biar bersih
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('✅ Data lama berhasil dihapus.');

  // Kita tidak menghapus User. Tapi pastikan Super Admin & Staff ada untuk berelasi.
  const hash = await bcrypt.hash('password123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@suti.com' },
    update: {},
    create: { email: 'admin@suti.com', name: 'Super Admin Suti', password: hash, role: Role.SUPER_ADMIN },
  });

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

  console.log('✅ Users diverifikasi.');

  // Categories
  const catGalon = await prisma.category.create({ data: { name: 'Air Mineral Galon', slug: 'air-galon', icon: 'drum' } });
  const catKardus = await prisma.category.create({ data: { name: 'Air Mineral Kardus', slug: 'air-kardus', icon: 'box' } });
  const catGelas = await prisma.category.create({ data: { name: 'Air Mineral Gelas', slug: 'air-gelas', icon: 'cup' } });

  // Products
  const prodGalon19 = await prisma.product.create({
    data: { name: 'Suti Water Galon 19L', sku: 'GAL-19L', categoryId: catGalon.id, unit: 'Galon', priceBuy: 12000, priceSell: 18000, stock: 150, minStock: 20, imageUrl: IMG_GALON, createdBy: superAdmin.id },
  });
  const prodKardus240 = await prisma.product.create({
    data: { name: 'Suti Water Gelas 220ml', sku: 'KRD-220', categoryId: catGelas.id, unit: 'Kardus', priceBuy: 15000, priceSell: 20000, stock: 100, minStock: 15, imageUrl: IMG_GELAS, createdBy: superAdmin.id },
  });
  const prodKardus600 = await prisma.product.create({
    data: { name: 'Suti Water Botol 600ml', sku: 'KRD-600', categoryId: catKardus.id, unit: 'Kardus', priceBuy: 28000, priceSell: 35000, stock: 80, minStock: 10, imageUrl: IMG_BOTOL, createdBy: superAdmin.id },
  });

  // Suppliers
  const sup1 = await prisma.supplier.create({ data: { name: 'CV. Lumbung Toda', phone: '0877-7004-2820', address: 'Sindang Barang RT 04/04, Bogor' } });
  const sup2 = await prisma.supplier.create({ data: { name: 'PT. Sumber Air Bersih', phone: '021-5551234', address: 'Kawasan Industri Pulogadung' } });

  // Agents
  const agent1 = await prisma.agent.create({ data: { name: 'Yayasan Islam Al-Qudwah', pic: 'H. Nurjaya', phone: '021-7758033', address: 'Depok' } });
  const agent2 = await prisma.agent.create({ data: { name: 'Toserba Maju Jaya', pic: 'Dr. Sofyan', phone: '0811-1226-242', address: 'Bogor' } });

  // Discounts
  const discount = await prisma.discount.create({
    data: { name: 'Diskon Akhir Tahun', description: 'Diskon 10%', type: 'PERCENTAGE', value: 10, applicableTo: 'ALL', minQuantity: 100, startDate: dateOf(1, 1), endDate: dateOf(12, 31), isActive: true, createdBy: superAdmin.id },
  });

  // Stock In
  await prisma.stockIn.createMany({
    data: [
      { productId: prodGalon19.id, userId: staff1.id, supplierId: sup1.id, quantity: 200, remainingStock: 150, pricePerUnit: 12000, totalCost: 2400000, entryDate: dateOf(new Date().getMonth() + 1, 1) },
      { productId: prodKardus240.id, userId: staff1.id, supplierId: sup2.id, quantity: 150, remainingStock: 100, pricePerUnit: 15000, totalCost: 2250000, entryDate: dateOf(new Date().getMonth() + 1, 2) },
      { productId: prodKardus600.id, userId: staff1.id, supplierId: sup1.id, quantity: 80, remainingStock: 80, pricePerUnit: 28000, totalCost: 2240000, entryDate: dateOf(new Date().getMonth() + 1, 3) },
    ]
  });

  // Stock Out
  await prisma.stockOut.createMany({
    data: [
      { productId: prodGalon19.id, userId: staff2.id, agentId: agent1.id, buyerName: agent1.name, quantity: 50, productStockSnapshot: 150, pricePerUnit: 18000, discountAmount: 0, totalPrice: 900000, exitDate: dateOf(new Date().getMonth() + 1, 5) },
      { productId: prodKardus240.id, userId: staff2.id, agentId: agent2.id, buyerName: agent2.name, quantity: 50, productStockSnapshot: 100, pricePerUnit: 20000, discountAmount: 0, totalPrice: 1000000, exitDate: dateOf(new Date().getMonth() + 1, 6) },
    ]
  });

  // Refrigerators (Kulkas Suti)
  const kulkasMasjid = await prisma.refrigerator.create({
    data: { name: 'Kulkas Masjid Raya', location: 'Masjid', code: 'MSJ-01', description: 'Kulkas di teras masjid', imageUrl: IMG_KULKAS, profitSharingEnabled: true, createdBy: superAdmin.id }
  });
  const kulkasTeknik = await prisma.refrigerator.create({
    data: { name: 'Kulkas Fakultas Teknik', location: 'Fakultas Teknik', code: 'FT-01', description: 'Kulkas di lobi dekanat', imageUrl: IMG_KULKAS, profitSharingEnabled: true, createdBy: superAdmin.id }
  });

  // Refrigerator Shares
  await prisma.refrigeratorShare.createMany({
    data: [
      { refrigeratorId: kulkasMasjid.id, instansiName: 'DKM Masjid', percentage: 40 },
      { refrigeratorId: kulkasMasjid.id, instansiName: 'Suti Water', percentage: 60 },
      { refrigeratorId: kulkasTeknik.id, instansiName: 'BEM Teknik', percentage: 30 },
      { refrigeratorId: kulkasTeknik.id, instansiName: 'Suti Water', percentage: 70 },
    ]
  });

  // Refrigerator Fills
  await prisma.refrigeratorFill.createMany({
    data: [
      { refrigeratorId: kulkasMasjid.id, productId: prodKardus600.id, userId: staff1.id, fillDate: dateOf(new Date().getMonth() + 1, 10), boxCount: 5, bottlesPerBox: 24, pricePerBox: 28000, pricePerBottle: 2000, totalBottles: 120, totalCost: 140000 },
      { refrigeratorId: kulkasTeknik.id, productId: prodKardus600.id, userId: staff1.id, fillDate: dateOf(new Date().getMonth() + 1, 11), boxCount: 3, bottlesPerBox: 24, pricePerBox: 28000, pricePerBottle: 2000, totalBottles: 72, totalCost: 84000 },
    ]
  });

  // Refrigerator Weekly Reports
  const reportMasjid = await prisma.refrigeratorWeeklyReport.create({
    data: { refrigeratorId: kulkasMasjid.id, userId: staff1.id, periodStart: dateOf(new Date().getMonth() + 1, 1), periodEnd: dateOf(new Date().getMonth() + 1, 7), actualRevenue: 240000, modalCost: 140000, netProfit: 100000, notes: 'Laris manis' }
  });
  
  await prisma.refrigeratorReportShare.createMany({
    data: [
      { reportId: reportMasjid.id, instansiName: 'DKM Masjid', percentage: 40, amount: 40000 },
      { reportId: reportMasjid.id, instansiName: 'Suti Water', percentage: 60, amount: 60000 },
    ]
  });

  // Kulkas Rekap
  const rekapKampus = await prisma.kulkasRekap.create({
    data: { userId: staff2.id, rekapDate: dateOf(new Date().getMonth() + 1, 15), title: 'Rekap Kampus & Masjid', dusSold: 8, pricePerDus: 28000, modalCost: 224000, cashTotal: 300000, qrisTotal: 50000, grandTotal: 350000, netProfit: 126000 }
  });

  await prisma.kulkasRekapLine.createMany({
    data: [
      { rekapId: rekapKampus.id, refrigeratorId: kulkasMasjid.id, label: 'Kulkas Masjid Raya', qty500: 0, qty1000: 10, qty2000: 20, qty5000: 10, qty10000: 5, qty20000: 0, qty50000: 1, qty100000: 0, cashTotal: 200000, qrisAmount: 20000, sortOrder: 1 },
      { rekapId: rekapKampus.id, refrigeratorId: kulkasTeknik.id, label: 'Kulkas Fakultas Teknik', qty500: 0, qty1000: 0, qty2000: 10, qty5000: 6, qty10000: 5, qty20000: 0, qty50000: 0, qty100000: 0, cashTotal: 100000, qrisAmount: 30000, sortOrder: 2 },
    ]
  });

  await prisma.kulkasRekapShare.createMany({
    data: [
      { rekapId: rekapKampus.id, instansiName: 'DKM Masjid', percentage: 40, amount: 40000, sortOrder: 1 },
      { rekapId: rekapKampus.id, instansiName: 'BEM Teknik', percentage: 30, amount: 37800, sortOrder: 2 },
      { rekapId: rekapKampus.id, instansiName: 'Suti Water', percentage: 100, amount: 48200, sortOrder: 3 },
    ]
  });

  console.log('✅ Semua data dummy baru berhasil di-seed!');
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
