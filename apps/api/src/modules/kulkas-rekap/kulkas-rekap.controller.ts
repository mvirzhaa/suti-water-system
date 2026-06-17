import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { KulkasRekapService } from './kulkas-rekap.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { rekapListQuerySchema } from './kulkas-rekap.schema';

const service = new KulkasRekapService();

const auditCtx = (req: Request) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') ?? undefined,
});

// Parse query manual (req.query getter-only di Express 5).
function parseQuery<T>(schema: ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ApiError(400, 'Validasi gagal, periksa kembali input Anda', 'VALIDATION_ERROR');
  }
  return result.data;
}

export class KulkasRekapController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(rekapListQuerySchema, req.query);
      const result = await service.list(query);
      ApiResponse.success(res, result.data, 'Daftar rekap berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getById(req.params.id as string);
      ApiResponse.success(res, data, 'Detail rekap berhasil diambil');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.create(req.body, req.user!.userId, auditCtx(req));
      ApiResponse.created(res, data, 'Rekap pekanan berhasil disimpan');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.remove(req.params.id as string, req.user!.userId, auditCtx(req));
      ApiResponse.success(res, data, 'Rekap pekanan berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}
