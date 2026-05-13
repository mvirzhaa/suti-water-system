import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../utils/ApiResponse';
import { getPaginationParams, buildMeta } from '../../utils/pagination';

/**
 * GET /api/v1/products
 */
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: { deletedAt: null } })
    ]);

    ApiResponse.success(res, products, 'Berhasil mengambil daftar produk', 200, buildMeta(page, limit, total));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/products
 */
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, sku, categoryId, unit, priceBuy, priceSell, minStock, description } = req.body;

    if (sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return next({ statusCode: 409, message: 'SKU produk sudah digunakan', code: 'CONFLICT' });
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
        description,
        createdBy: req.user?.userId // Ambil dari token
      }
    });

    ApiResponse.created(res, newProduct, 'Produk berhasil didaftarkan');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/products/:id
 */
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });


    ApiResponse.success(res, null, 'Produk berhasil dihapus (Soft Delete)');
  } catch (error) {
    next(error);
  }
};