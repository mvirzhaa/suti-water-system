import { Request, Response } from 'express';
import prisma from '../../config/database';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Memanfaatkan Pagination Utility yang sudah kamu buat (asumsi manual via query jika belum terhubung)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null }, // Hanya ambil yang tidak di-soft-delete
        skip,
        take: limit,
        include: { category: true }, // Join table kategori
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: { deletedAt: null } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar produk',
      data: products,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sku, categoryId, unit, priceBuy, priceSell, minStock } = req.body;

    if (sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        res.status(409).json({ success: false, message: 'SKU produk sudah digunakan' });
        return;
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unit,
        priceBuy,
        priceSell,
        minStock,
        // stock akan default 0 sesuai Prisma Schema
      }
    });

    res.status(201).json({
      success: true,
      message: 'Produk berhasil didaftarkan',
      data: newProduct
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Lakukan Soft Delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    res.status(200).json({ success: true, message: 'Produk berhasil dihapus (Soft Delete)' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus produk', error: error.message });
  }
};