import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../utils/ApiResponse';
import { getPaginationParams, buildMeta } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLog';
import { updateProductSchema } from './products.schema';

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
    const userId = req.user?.userId;

    if (sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return next({ statusCode: 409, message: 'SKU produk sudah digunakan', code: 'CONFLICT' });
      }
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          sku,
          categoryId,
          unit,
          priceBuy,
          priceSell,
          minStock,
          description,
          createdBy: userId
        }
      });

      if (userId) {
        await createAuditLog({
          userId,
          action: 'CREATE',
          entity: 'PRODUCT',
          entityId: product.id,
          newValue: req.body
        });
      }

      return product;
    });

    ApiResponse.created(res, newProduct, 'Produk berhasil didaftarkan');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/products/:id
 */
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const updateData = updateProductSchema.parse(req.body);

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const oldProduct = await tx.product.findUnique({ where: { id } });
      if (!oldProduct) {
        throw { statusCode: 404, message: 'Produk tidak ditemukan', code: 'NOT_FOUND' };
      }

      const product = await tx.product.update({
        where: { id },
        data: updateData
      });

      if (userId) {
        await createAuditLog({
          userId,
          action: 'UPDATE',
          entity: 'PRODUCT',
          entityId: product.id,
          oldValue: oldProduct || undefined,
          newValue: updateData
        });
      }

      return product;
    });

    ApiResponse.success(res, updatedProduct, 'Produk berhasil diperbarui');
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
    const userId = req.user?.userId;

    await prisma.$transaction(async (tx) => {
      const oldProduct = await tx.product.findUnique({ where: { id } });
      
      await tx.product.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false }
      });

      if (userId) {
        await createAuditLog({
          userId,
          action: 'DELETE',
          entity: 'PRODUCT',
          entityId: id,
          oldValue: oldProduct || undefined
        });
      }
    });

    ApiResponse.success(res, null, 'Produk berhasil dihapus (Soft Delete)');
  } catch (error) {
    next(error);
  }
};