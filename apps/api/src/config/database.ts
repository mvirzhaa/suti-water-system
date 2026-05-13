import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Pengaman: Jika env masih gagal terbaca, server akan langsung teriak
if (!process.env.DATABASE_URL) {
  throw new Error("💥 DATABASE_URL tidak ditemukan! File .env gagal dibaca.");
}

// 1. Buat connection pool standar PostgreSQL
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Bungkus dengan Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Masukkan adapter ke dalam Prisma Client
const prisma = new PrismaClient({ adapter });

export default prisma;