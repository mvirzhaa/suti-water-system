import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Konfigurasi Database Adapter (Sesuai Prisma v7)
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@suti.com' },
    update: {},
    create: {
      email: 'admin@suti.com',
      name: 'Super Admin Suti',
      password: passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });

  const pimpinan = await prisma.user.upsert({
    where: { email: 'pimpinan@suti.com' },
    update: {},
    create: {
      email: 'pimpinan@suti.com',
      name: 'Pimpinan Suti',
      password: passwordHash,
      role: Role.PIMPINAN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@suti.com' },
    update: {},
    create: {
      email: 'staff@suti.com',
      name: 'Staff Gudang Suti',
      password: passwordHash,
      role: Role.STAFF,
    },
  });

  console.log('✅ Users created (admin@suti.com, pimpinan@suti.com, staff@suti.com / password123)');

  // 2. Create Categories
  const categories = [
    { name: 'Air Mineral Gelas', slug: 'air-gelas', icon: 'cup' },
    { name: 'Air Mineral Botol', slug: 'air-botol', icon: 'bottle' },
    { name: 'Air Mineral Galon', slug: 'air-galon', icon: 'drum' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const gelasCat = await prisma.category.findUnique({ where: { slug: 'air-gelas' } });
  const botolCat = await prisma.category.findUnique({ where: { slug: 'air-botol' } });

  console.log('✅ Categories created');

  // 3. Create Products
  if (gelasCat && botolCat) {
    await prisma.product.upsert({
      where: { sku: 'GLS-001' },
      update: {},
      create: {
        name: 'Suti Water Gelas 240ml (Kardus)',
        sku: 'GLS-001',
        categoryId: gelasCat.id,
        unit: 'Kardus',
        priceBuy: 15000,
        priceSell: 18000,
        stock: 50,
        createdBy: superAdmin.id,
      },
    });

    await prisma.product.upsert({
      where: { sku: 'BTL-001' },
      update: {},
      create: {
        name: 'Suti Water Botol 600ml (Kardus)',
        sku: 'BTL-001',
        categoryId: botolCat.id,
        unit: 'Kardus',
        priceBuy: 30000,
        priceSell: 35000,
        stock: 20,
        createdBy: superAdmin.id,
      },
    });
  }

  console.log('✅ Products created');
  console.log('✨ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
