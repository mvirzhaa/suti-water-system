import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../utils/ApiResponse';

/**
 * GET /api/v1/categories
 */
export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    ApiResponse.success(res, categories, 'Berhasil mengambil daftar kategori');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/categories
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, icon } = req.body;
    
    // Auto-generate slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingCategory = await prisma.category.findUnique({ where: { slug } });
    if (existingCategory) {
      return next({ statusCode: 409, message: 'Kategori dengan nama ini sudah ada', code: 'CONFLICT' });
    }

    const newCategory = await prisma.category.create({
      data: { name, slug, icon }
    });

    ApiResponse.created(res, newCategory, 'Kategori berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/categories/:id
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Cek apakah ada produk di kategori ini
    const productCount = await prisma.product.count({ 
      where: { categoryId: id, deletedAt: null } 
    });
    
    if (productCount > 0) {
      return next({ 
        statusCode: 400, 
        message: 'Kategori tidak bisa dihapus karena masih memiliki produk aktif', 
        code: 'BAD_REQUEST' 
      });
    }

    await prisma.category.delete({ where: { id } });
    ApiResponse.success(res, null, 'Kategori berhasil dihapus');
  } catch (error) {
    next(error);
  }
};