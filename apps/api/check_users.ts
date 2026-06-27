import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, isActive: u.isActive })));
  
  if (users.length > 0) {
    const admin = users.find(u => u.email === 'admin@suti.com');
    if (admin && admin.password) {
      console.log("Found admin, checking password 'password123':");
      const isValid = await bcrypt.compare('password123', admin.password);
      console.log("Is 'password123' valid?", isValid);
    }
  }
}

checkUsers()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
