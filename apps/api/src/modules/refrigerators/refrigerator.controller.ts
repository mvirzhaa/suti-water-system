import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { RefrigeratorService } from './refrigerator.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import {
  listQuerySchema,
  fillListQuerySchema,
  recapPreviewQuerySchema,
  reportListQuerySchema,
} from './refrigerator.schema';

const service = new RefrigeratorService();

// Ambil konteks audit dari request (IP + user agent), seragam untuk semua aksi.
const auditCtx = (req: Request) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') ?? undefined,
});

/**
 * Parse query manual (req.query getter-only di Express 5, tak bisa di-replace
 * oleh middleware validate). Lempar VALIDATION_ERROR yang sama dengan validate.
 */
function parseQuery<T>(schema: ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ApiError(400, 'Validasi gagal, periksa kembali input Anda', 'VALIDATION_ERROR');
  }
  return result.data;
}

export class RefrigeratorController {
  // --- MASTER KULKAS ---------------------------------------------------------

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(listQuerySchema, req.query);
      const result = await service.list(query);
      ApiResponse.success(res, result.data, 'Daftar kulkas berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getTodaySummary();
      ApiResponse.success(res, data, 'Ringkasan kulkas hari ini');
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getById(req.params.id as string);
      ApiResponse.success(res, data, 'Detail kulkas berhasil diambil');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.create(req.body, req.user!.userId, auditCtx(req));
      ApiResponse.created(res, data, 'Kulkas berhasil ditambahkan');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.update(req.params.id as string, req.body, req.user!.userId, auditCtx(req));
      ApiResponse.success(res, data, 'Kulkas berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.remove(req.params.id as string, req.user!.userId, auditCtx(req));
      ApiResponse.success(res, data, 'Kulkas berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  // --- PENGISIAN (FILL) ------------------------------------------------------

  async createFill(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.createFill(req.params.id as string, req.body, req.user!.userId, auditCtx(req));
      ApiResponse.created(res, data, 'Pengisian kulkas berhasil dicatat');
    } catch (error) {
      next(error);
    }
  }

  async listFills(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(fillListQuerySchema, req.query);
      const result = await service.listFills(req.params.id as string, query);
      ApiResponse.success(res, result.data, 'Riwayat pengisian berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async removeFill(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.removeFill(
        req.params.id as string,
        req.params.fillId as string,
        req.user!.userId,
        auditCtx(req),
      );
      ApiResponse.success(res, data, 'Data pengisian berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }

  async updateFill(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.updateFill(
        req.params.id as string,
        req.params.fillId as string,
        req.body,
        req.user!.userId,
        auditCtx(req),
      );
      ApiResponse.success(res, data, 'Data pengisian berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  // --- REKAP PEKANAN / BAGI HASIL --------------------------------------------

  async recapPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = parseQuery(recapPreviewQuerySchema, req.query);
      const data = await service.recapPreview(req.params.id as string, from, to);
      ApiResponse.success(res, data, 'Pratinjau rekap berhasil dihitung');
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.createWeeklyReport(req.params.id as string, req.body, req.user!.userId, auditCtx(req));
      ApiResponse.created(res, data, 'Rekap pekanan berhasil disimpan');
    } catch (error) {
      next(error);
    }
  }

  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseQuery(reportListQuerySchema, req.query);
      const result = await service.listWeeklyReports(req.params.id as string, query);
      ApiResponse.success(res, result.data, 'Riwayat rekap berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async removeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.removeWeeklyReport(
        req.params.id as string,
        req.params.reportId as string,
        req.user!.userId,
        auditCtx(req),
      );
      ApiResponse.success(res, data, 'Rekap pekanan berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}
