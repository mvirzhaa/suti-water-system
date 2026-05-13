import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from './audit-logs.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { getPaginationParams, buildMeta } from '../../utils/pagination';

const auditLogService = new AuditLogService();

export class AuditLogController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { userId, entity, action } = req.query;

      const { data, total } = await auditLogService.findAll({
        skip,
        take: limit,
        userId: userId as string,
        entity: entity as string,
        action: action as string
      });

      ApiResponse.success(
        res,
        data,
        'Berhasil mengambil riwayat aktivitas',
        200,
        buildMeta(page, limit, total)
      );
    } catch (error) {
      next(error);
    }
  }
}
