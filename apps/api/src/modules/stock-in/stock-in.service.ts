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
    const { productId, quantity, pricePerUnit, supplier, supplierId, entryDate, notes } = dto;

    // Hitung total cost
    const totalCost = quantity * pricePerUnit;

    // Mulai Transaksi
    return await prisma.$transaction(async (tx) => {
      // 1. Cek apakah produk ada
      const product = await tx.product.findUnique({
        where: { id: productId, deletedAt: null }
      });

      if (!product) {
        throw ApiError.notFound('Produk tidak ditemukan');
      }

      // 2. Buat record StockIn
      const stockIn = await tx.stockIn.create({
        data: {
          productId,
          userId,
          supplierId,
          quantity,
          pricePerUnit,
          totalCost,
          supplier, // Fallback string
          entryDate: new Date(entryDate),
          notaUrl: file?.path || file?.url, // Cloudinary URL
          notes
        },
        include: { product: true }
      });

      // 3. Update stok di tabel Product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
        }
      });

      // 4. Catat Audit Log
      await createAuditLog({
        userId,
        action: 'STOCK_IN',
        entity: 'PRODUCT',
        entityId: productId,
        newValue: { quantity, stockAfter: updatedProduct.stock },
        metadata: { stockInId: stockIn.id }
      });

      return stockIn;
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
