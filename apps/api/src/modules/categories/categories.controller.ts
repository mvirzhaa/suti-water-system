import { Request, Response } from 'express';
import prisma from '../../config/database';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil daftar kategori',
      data: categories
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.body sudah divalidasi oleh middleware Zod sebelumnya
    const { name, icon } = req.body;
    
    // Auto-generate slug dari nama
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existingCategory = await prisma.category.findUnique({ where: { slug } });
    if (existingCategory) {
      res.status(409).json({ success: false, message: 'Kategori dengan nama ini sudah ada' });
      return;
    }

    const newCategory = await prisma.category.create({
      data: { name, slug, icon }
    });

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat',
      data: newCategory
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};