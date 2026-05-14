import prisma from '../../config/database';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.schema';
import { createAuditLog } from '../../utils/auditLog';

export class SuppliersService {
  async getAll() {
    return prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: string) {
    return prisma.supplier.findUnique({
      where: { id }
    });
  }

  async create(userId: string, data: CreateSupplierDto) {
    return await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({ data });
      
      await createAuditLog({
        userId,
        action: 'CREATE',
        entity: 'SUPPLIER',
        entityId: supplier.id,
        newValue: data
      });

      return supplier;
    });
  }

  async update(userId: string, id: string, data: UpdateSupplierDto) {
    return await prisma.$transaction(async (tx) => {
      const oldSupplier = await tx.supplier.findUnique({ where: { id } });
      const supplier = await tx.supplier.update({
        where: { id },
        data
      });
      
      await createAuditLog({
        userId,
        action: 'UPDATE',
        entity: 'SUPPLIER',
        entityId: supplier.id,
        oldValue: oldSupplier || undefined,
        newValue: data
      });

      return supplier;
    });
  }

  async delete(userId: string, id: string) {
    return await prisma.$transaction(async (tx) => {
      const oldSupplier = await tx.supplier.findUnique({ where: { id } });
      const supplier = await tx.supplier.delete({
        where: { id }
      });
      
      await createAuditLog({
        userId,
        action: 'DELETE',
        entity: 'SUPPLIER',
        entityId: supplier.id,
        oldValue: oldSupplier || undefined
      });

      return supplier;
    });
  }
}
