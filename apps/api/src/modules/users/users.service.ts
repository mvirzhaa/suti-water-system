import prisma from '../../config/database';
import { CreateUserDto, UpdateUserDto } from './users.schema';
import bcrypt from 'bcryptjs';

export class UsersService {
  async getAll() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      }
    });
  }

  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
