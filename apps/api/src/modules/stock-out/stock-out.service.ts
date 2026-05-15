import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateStockOutDto } from './stock-out.schema';
import { createAuditLog } from '../../utils/auditLog';

export class StockOutService {
  /**
   * Mencatat barang keluar (Penjualan/Pengeluaran Stok)
   */
  async create(userId: string, dto: CreateStockOutDto, file?: any) {
    const { productId, quantity, pricePerUnit, discountId, agentId, buyerName, exitDate, notes } = dto;

    const stockOut = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId, deletedAt: null }
      });

      if (!product) throw ApiError.notFound('Produk tidak ditemukan');

      if (product.stock < quantity) {
        throw ApiError.badRequest(`Stok tidak mencukupi. Stok saat ini: ${product.stock} ${product.unit}`, 'INSUFFICIENT_STOCK');
      }

      let discountAmount = 0;
      if (discountId) {
        const discount = await tx.discount.findUnique({ where: { id: discountId, isActive: true } });
        if (discount) {
          discountAmount = discount.type === 'PERCENTAGE'
            ? (Number(pricePerUnit) * quantity * Number(discount.value)) / 100
            : Number(discount.value);
        }
      }

      const totalPrice = (Number(pricePerUnit) * quantity) - discountAmount;

      const stockOut = await tx.stockOut.create({
        data: {
          productId, userId, discountId, agentId, quantity, pricePerUnit,
          discountAmount, totalPrice, buyerName,
          exitDate: new Date(exitDate),
          notaUrl: file?.path || file?.url,
          notes
        },
        include: { product: true }
      });

      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } }
      });

      return stockOut;
    });

    // Audit log di luar transaction
    createAuditLog({
      userId, action: 'STOCK_OUT', entity: 'PRODUCT', entityId: productId,
      newValue: { quantity },
      metadata: { stockOutId: stockOut.id }
    });

    return stockOut;
  }

  async findAll(params: { skip: number, take: number, productId?: string }) {
    const where = params.productId ? { productId: params.productId } : {};
    
    const [data, total] = await Promise.all([
      prisma.stockOut.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          user: { select: { name: true } },
          agent: { select: { name: true } },
          discount: { select: { name: true, value: true, type: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockOut.count({ where })
    ]);

    return { data, total };
  }

  /**
   * Hapus record barang keluar dan kembalikan stok produk secara atomik
   * Hanya SUPER_ADMIN & PIMPINAN yang boleh menghapus (dijaga di level route)
   */
  async delete(userId: string, id: string) {
    return await prisma.$transaction(async (tx) => {
      const stockOut = await tx.stockOut.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!stockOut) throw ApiError.notFound('Data barang keluar tidak ditemukan');

      await tx.product.update({
        where: { id: stockOut.productId },
        data: { stock: { increment: stockOut.quantity } },
      });

      await tx.stockOut.delete({ where: { id } });

      return { id, productId: stockOut.productId };
    }).then((result) => {
      createAuditLog({
        userId, action: 'DELETE_STOCK_OUT', entity: 'PRODUCT', entityId: result.productId,
        metadata: { stockOutId: id }
      });
      return result;
    });
  }
}
