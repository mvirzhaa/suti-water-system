import prisma from '../../config/database';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.schema';

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

  async create(data: CreateSupplierDto) {
    return prisma.supplier.create({
      data
    });
  }

  async update(id: string, data: UpdateSupplierDto) {
    return prisma.supplier.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.supplier.delete({
      where: { id }
    });
  }
}
