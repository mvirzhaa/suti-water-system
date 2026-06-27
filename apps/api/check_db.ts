import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import prisma from './src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, isActive: u.isActive })));
  
  const admin = users.find(u => u.email === 'admin@suti.com');
  if (admin && admin.password) {
    const isValid = await bcrypt.compare('password123', admin.password);
    console.log("Is 'password123' valid?", isValid);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    // some cleanup if needed
  });
