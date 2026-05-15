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
    return prisma.supplier.findUnique({ where: { id } });
  }

  async create(userId: string, data: CreateSupplierDto, imageUrl?: string) {
    // Tidak perlu transaction — hanya 1 tabel yang diubah
    const supplier = await prisma.supplier.create({
      data: { ...data, imageUrl: imageUrl ?? data.imageUrl },
    });

    // Audit log di luar — tidak memblokir response
    createAuditLog({ userId, action: 'CREATE', entity: 'SUPPLIER', entityId: supplier.id, newValue: data });

    return supplier;
  }

  async update(userId: string, id: string, data: UpdateSupplierDto, imageUrl?: string) {
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });

    const updateData: UpdateSupplierDto & { imageUrl?: string } = { ...data };
    if (imageUrl) updateData.imageUrl = imageUrl;

    const supplier = await prisma.supplier.update({ where: { id }, data: updateData });

    // Audit log di luar — tidak memblokir response
    createAuditLog({ userId, action: 'UPDATE', entity: 'SUPPLIER', entityId: id, oldValue: oldSupplier || undefined, newValue: data });

    return supplier;
  }

  async delete(userId: string, id: string) {
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });
    const supplier = await prisma.supplier.delete({ where: { id } });

    // Audit log di luar — tidak memblokir response
    createAuditLog({ userId, action: 'DELETE', entity: 'SUPPLIER', entityId: id, oldValue: oldSupplier || undefined });

    return supplier;
  }
}
