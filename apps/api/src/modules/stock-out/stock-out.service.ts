import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateStockOutDto } from './stock-out.schema';
import { createAuditLog } from '../../utils/auditLog';

export class StockOutService {
  /**
   * Mencatat barang keluar (Penjualan/Pengeluaran Stok)
   */
  async create(userId: string, dto: CreateStockOutDto) {
    const { productId, quantity, pricePerUnit, discountId, buyerName, exitDate, notes } = dto;

    return await prisma.$transaction(async (tx) => {
      // 1. Ambil data produk & cek stok
      const product = await tx.product.findUnique({
        where: { id: productId, deletedAt: null }
      });

      if (!product) {
        throw ApiError.notFound('Produk tidak ditemukan');
      }

      if (product.stock < quantity) {
        throw ApiError.badRequest(`Stok tidak mencukupi. Stok saat ini: ${product.stock} ${product.unit}`, 'INSUFFICIENT_STOCK');
      }

      // 2. Kalkulasi Diskon (Sederhana dulu, nanti bisa diperdalam di modul Discount)
      let discountAmount = 0;
      if (discountId) {
        const discount = await tx.discount.findUnique({ where: { id: discountId, isActive: true } });
        if (discount) {
          if (discount.type === 'PERCENTAGE') {
            discountAmount = (Number(pricePerUnit) * quantity * Number(discount.value)) / 100;
          } else {
            discountAmount = Number(discount.value);
          }
        }
      }

      const totalPrice = (Number(pricePerUnit) * quantity) - discountAmount;

      // 3. Buat record StockOut
      const stockOut = await tx.stockOut.create({
        data: {
          productId,
          userId,
          discountId,
          quantity,
          pricePerUnit,
          discountAmount,
          totalPrice,
          buyerName,
          exitDate: new Date(exitDate),
          notes
        },
        include: { product: true }
      });

      // 4. Kurangi stok produk
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity }
        }
      });

      // 5. Audit Log
      await createAuditLog({
        userId,
        action: 'STOCK_OUT',
        entity: 'PRODUCT',
        entityId: productId,
        newValue: { quantity, stockAfter: updatedProduct.stock },
        metadata: { stockOutId: stockOut.id }
      });

      return stockOut;
    });
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
          discount: { select: { name: true, value: true, type: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockOut.count({ where })
    ]);

    return { data, total };
  }
}
