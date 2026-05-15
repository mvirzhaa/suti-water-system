import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error("💥 DATABASE_URL tidak ditemukan! File .env gagal dibaca.");
}

// Connection pool dengan konfigurasi yang optimal untuk development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // Maksimal 10 koneksi paralel
  idleTimeoutMillis: 30000,   // Tutup koneksi idle setelah 30 detik
  connectionTimeoutMillis: 5000, // Timeout jika tidak dapat koneksi dalam 5 detik
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;