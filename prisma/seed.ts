import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Menyiapkan database untuk Production...');
  
  // Hapus data secara berurutan sesuai relasi (opsional, untuk memastikan bersih)
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
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('✅ Data lama berhasil dibersihkan.');

  // Membuat Akun Super Admin Default
  const hash = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@suti.com' },
    update: {},
    create: { 
      email: 'admin@suti.com', 
      name: 'Super Admin Suti', 
      password: hash, 
      role: Role.SUPER_ADMIN 
    },
  });

  console.log('✅ Akun Admin berhasil dibuat!');
  console.log('Email: admin@suti.com');
  console.log('Password: password123');
  console.log('Silakan segera ganti password ini setelah login.');
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
