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

  // 4. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'CV. Lumbung Toda',
      phone: '0877-7004-2820',
      address: 'Sindang barang rt 04/04 pasir eurih, Kp. Parung Jambu, Pasireurih, Kec. Tamansari, Kabupaten Bogor, Jawa Barat 16610',
    }
  });
  console.log('✅ Suppliers created');

  // 5. Create Agents
  const agents = [
    { name: 'Yayasan Islam Al-Qudwah', pic: 'H. Nurjaya, M.Pd.', phone: '(021) 7758033', address: 'Jl. Beringin, No. 01, Jl. Margonda No.18, RT.04, Kemiri Muka, Kecamatan Beji, Kota Depok, Jawa Barat 16423' },
    { name: 'Toserba Maju Jaya Manunggal', pic: 'Dr. Sofyan Basyir, SE.', phone: '0811 1226 242', address: 'Jl. Re. Martadinata No.42, RT.01/RW.11, Ciwaringin, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16124' },
    { name: 'SMPIT Darul Quran Mulia Pabuaran', pic: 'Bpk Jauhari', phone: '0812 8882 9847', address: 'Jl. Raya Puspitek Pembangunan, Kp. Cikarang, Rt. 04/05, Desa. Pabuaran' },
    { name: 'Cahaya Mart', pic: 'Dr. Ir. H. Dwi Sudharto, M.Si', phone: '0852 1042 3279', address: 'Jl. Perdana Raya No.22, RT.01/RW.10, Kedungbadak, Kec. Tanah Sereal, Kota Bogor, Jawa Barat 16710' }
  ];

  for (const ag of agents) {
    await prisma.agent.create({
      data: ag
    });
  }
  console.log('✅ Agents created');

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
