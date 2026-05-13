import { Request, Response, NextFunction } from 'express';
import { DiscountService } from './discounts.service';
import { ApiResponse } from '../../utils/ApiResponse';

const discountService = new DiscountService();

export class DiscountController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await discountService.create(req.user!.userId, req.body);
      ApiResponse.created(res, discount, 'Diskon berhasil dibuat');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const discounts = await discountService.findAll();
      ApiResponse.success(res, discounts, 'Berhasil mengambil daftar diskon');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const discount = await discountService.update(id, req.body);
      ApiResponse.success(res, discount, 'Diskon berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await discountService.delete(id);
      ApiResponse.success(res, null, 'Diskon berhasil dinonaktifkan');
    } catch (error) {
      next(error);
    }
  }
}
