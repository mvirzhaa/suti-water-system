import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/ApiResponse';

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getDashboardSummary();
      ApiResponse.success(res, summary, 'Berhasil mengambil data dashboard');
    } catch (error) {
      next(error);
    }
  }
}
