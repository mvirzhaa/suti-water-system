import { Request, Response, NextFunction } from 'express';
import { StockOutService } from './stock-out.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { getPaginationParams, buildMeta } from '../../utils/pagination';

const stockOutService = new StockOutService();

export class StockOutController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const stockOut = await stockOutService.create(req.user!.userId, req.body, req.file);
      ApiResponse.created(res, stockOut, 'Berhasil mencatat barang keluar');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const productId = req.query.productId as string | undefined;

      const { data, total } = await stockOutService.findAll({ skip, take: limit, productId });
      
      ApiResponse.success(
        res, 
        data, 
        'Berhasil mengambil riwayat barang keluar', 
        200, 
        buildMeta(page, limit, total)
      );
    } catch (error) {
      next(error);
    }
  }
}
