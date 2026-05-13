import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateDiscountDto, UpdateDiscountDto } from './discounts.schema';

export class DiscountService {
  /**
   * Buat diskon baru
   */
  async create(userId: string, dto: CreateDiscountDto) {
    const { productIds, ...data } = dto;

    return await prisma.$transaction(async (tx) => {
      // 1. Buat record Discount
      const discount = await tx.discount.create({
        data: {
          ...data,
          createdBy: userId,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          // Jika applicableTo adalah PRODUCT, kita akan hubungkan produknya nanti
        }
      });

      // 2. Jika diskon khusus produk tertentu, buat relasi di DiscountProduct
      if (data.applicableTo === 'PRODUCT' && productIds && productIds.length > 0) {
        await tx.discountProduct.createMany({
          data: productIds.map(productId => ({
            discountId: discount.id,
            productId
          }))
        });
      }

      return await tx.discount.findUnique({
        where: { id: discount.id },
        include: { discountProducts: { include: { product: true } } }
      });
    });
  }

  /**
   * Ambil semua diskon (aktif/tidak aktif)
   */
  async findAll() {
    return await prisma.discount.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { stockOuts: true } },
        discountProducts: { include: { product: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update diskon
   */
  async update(id: string, dto: UpdateDiscountDto) {
    const { productIds, ...data } = dto;

    return await prisma.$transaction(async (tx) => {
      // 1. Update data dasar
      const updateData: any = { ...data };
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);

      await tx.discount.update({
        where: { id },
        data: updateData
      });

      // 2. Jika ada update produk terkait
      if (productIds) {
        // Hapus relasi lama
        await tx.discountProduct.deleteMany({ where: { discountId: id } });
        
        // Tambah relasi baru
        if (productIds.length > 0) {
          await tx.discountProduct.createMany({
            data: productIds.map(productId => ({
              discountId: id,
              productId
            }))
          });
        }
      }

      return await tx.discount.findUnique({
        where: { id },
        include: { discountProducts: { include: { product: true } } }
      });
    });
  }

  /**
   * Soft Delete diskon
   */
  async delete(id: string) {
    await prisma.discount.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });
  }
}
