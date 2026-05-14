import prisma from '../../config/database';
import { CreateUserDto, UpdateUserDto } from './users.schema';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '../../utils/auditLog';

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

  async create(adminId: string, data: CreateUserDto) {
    return await prisma.$transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await tx.user.create({
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

      await createAuditLog({
        userId: adminId,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        newValue: { name: user.name, email: user.email, role: user.role }
      });

      return user;
    });
  }

  async update(adminId: string, id: string, data: UpdateUserDto) {
    return await prisma.$transaction(async (tx) => {
      const oldUser = await tx.user.findUnique({ where: { id } });
      const user = await tx.user.update({
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

      await createAuditLog({
        userId: adminId,
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        oldValue: { name: oldUser?.name, email: oldUser?.email, role: oldUser?.role },
        newValue: { name: user.name, email: user.email, role: user.role }
      });

      return user;
    });
  }

  async delete(adminId: string, id: string) {
    return await prisma.$transaction(async (tx) => {
      const oldUser = await tx.user.findUnique({ where: { id } });
      // Soft delete
      const user = await tx.user.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await createAuditLog({
        userId: adminId,
        action: 'DELETE',
        entity: 'USER',
        entityId: user.id,
        oldValue: { name: oldUser?.name, email: oldUser?.email }
      });

      return user;
    });
  }
}
