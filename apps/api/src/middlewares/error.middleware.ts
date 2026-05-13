import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

/**
 * Global Error Handler Middleware
 * Harus didaftarkan PALING AKHIR di app.ts (setelah semua route)
 * Express mengenali error middleware dari 4 parameter: (err, req, res, next)
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log semua error
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Error yang kita throw sendiri (ApiError)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma errors yang umum
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({
        success: false,
        message: 'Data sudah ada, terjadi duplikasi',
        code: 'CONFLICT',
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      // Record not found
      res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  // Generic 500 (jangan bocorkan detail ke client di production)
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Terjadi kesalahan server internal',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
}
