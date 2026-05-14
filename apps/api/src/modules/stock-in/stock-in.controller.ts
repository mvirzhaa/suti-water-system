import { Request, Response, NextFunction } from 'express';
import { StockInService } from './stock-in.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { getPaginationParams, buildMeta } from '../../utils/pagination';

const stockInService = new StockInService();

export class StockInController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // req.body sudah divalidasi oleh Zod middleware
      // req.file ada jika uploadNota berhasil
      const stockIn = await stockInService.create(req.user!.userId, req.body, req.file);
      ApiResponse.created(res, stockIn, 'Berhasil mencatat barang masuk dan menambah stok');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const productId = req.query.productId as string | undefined;

      const { data, total } = await stockInService.findAll({ skip, take: limit, productId });
      
      ApiResponse.success(
        res, 
        data, 
        'Berhasil mengambil riwayat barang masuk', 
        200, 
        buildMeta(page, limit, total)
      );
    } catch (error) {
      next(error);
    }
  }
}
