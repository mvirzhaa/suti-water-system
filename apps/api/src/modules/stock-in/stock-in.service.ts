import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateStockInDto } from './stock-in.schema';
import { createAuditLog } from '../../utils/auditLog';

export class StockInService {
  /**
   * Menambah stok barang masuk
   * Menggunakan Prisma Transaction agar data konsisten
   */
  async create(userId: string, dto: CreateStockInDto, file?: any) {
    const { productId, quantity, pricePerUnit, supplier, supplierId, entryDate, notes, size } = dto;

    // Hitung total cost
    const totalCost = quantity * pricePerUnit;

    // Mulai Transaksi — hanya untuk INSERT stock_in + UPDATE product.stock
    const stockIn = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId, deletedAt: null }
      });

      if (!product) {
        throw ApiError.notFound('Produk tidak ditemukan');
      }

      const stockIn = await tx.stockIn.create({
        data: {
          productId, userId, supplierId, quantity, pricePerUnit, totalCost,
          supplier,
          entryDate: new Date(entryDate),
          notaUrl: file?.path || file?.url,
          notes,
          size,
          remainingStock: quantity
        },
        include: { product: true }
      });

      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      return stockIn;
    });

    // Audit log di luar transaction — tidak memblokir commit
    createAuditLog({
      userId, action: 'STOCK_IN', entity: 'PRODUCT', entityId: productId,
      newValue: { quantity },
      metadata: { stockInId: stockIn.id }
    });

    return stockIn;
  }

  /**
   * Hapus record barang masuk dan kembalikan stok produk secara atomik
   * Hanya SUPER_ADMIN & PIMPINAN yang boleh menghapus (dijaga di level route)
   */
  async delete(userId: string, id: string) {
    return await prisma.$transaction(async (tx) => {
      const stockIn = await tx.stockIn.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!stockIn) {
        throw ApiError.notFound('Data barang masuk tidak ditemukan');
      }

      await tx.product.update({
        where: { id: stockIn.productId },
        data: { stock: { decrement: stockIn.quantity } },
      });

      await tx.stockIn.delete({ where: { id } });

      // Audit log di luar tidak bisa karena tx sudah commit — fire-and-forget setelah return
      return { id, productId: stockIn.productId, quantity: stockIn.quantity };
    }).then((result) => {
      createAuditLog({
        userId, action: 'DELETE_STOCK_IN', entity: 'PRODUCT', entityId: result.productId,
        metadata: { stockInId: id }
      });
      return result;
    });
  }

  /**
   * Ambil riwayat barang masuk dengan pagination
   */
  async findAll(params: { skip: number, take: number, productId?: string }) {
    const where = params.productId ? { productId: params.productId } : {};
    
    const [data, total] = await Promise.all([
      prisma.stockIn.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          suppl: { select: { name: true } },
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockIn.count({ where })
    ]);

    return { data, total };
  }
}
