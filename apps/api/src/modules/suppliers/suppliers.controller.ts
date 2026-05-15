import { Request, Response, NextFunction } from 'express';
import { SuppliersService } from './suppliers.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.schema';

const suppliersService = new SuppliersService();

export class SuppliersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await suppliersService.getAll();
      ApiResponse.success(res, suppliers, 'Berhasil mengambil data pemasok');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await suppliersService.getById(req.params.id as string);
      if (!supplier) {
        return ApiResponse.error(res, 'Pemasok tidak ditemukan', 404);
      }
      ApiResponse.success(res, supplier, 'Berhasil mengambil detail pemasok');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createSupplierSchema.parse(req.body);
      // Jika ada file foto, ambil URL dari Cloudinary (req.file.path)
      const imageUrl = req.file ? (req.file as any).path ?? (req.file as any).url : undefined;
      const supplier = await suppliersService.create(req.user!.userId, validatedData, imageUrl);
      ApiResponse.success(res, supplier, 'Pemasok berhasil ditambahkan', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateSupplierSchema.parse(req.body);
      const imageUrl = req.file ? (req.file as any).path ?? (req.file as any).url : undefined;
      const supplier = await suppliersService.update(req.user!.userId, req.params.id as string, validatedData, imageUrl);
      ApiResponse.success(res, supplier, 'Pemasok berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await suppliersService.delete(req.user!.userId, req.params.id as string);
      ApiResponse.success(res, null, 'Pemasok berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}
