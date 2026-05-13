import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

type AllowedRole = 'SUPER_ADMIN' | 'PIMPINAN' | 'STAFF';

/**
 * Middleware: Cek apakah user memiliki role yang diizinkan
 * Harus digunakan SETELAH verifyJWT
 *
 * Contoh penggunaan:
 *   router.get('/reports', verifyJWT, checkRole(['SUPER_ADMIN', 'PIMPINAN']), controller.getReports)
 */
export function checkRole(roles: AllowedRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Autentikasi diperlukan'));
    }

    if (!roles.includes(req.user.role as AllowedRole)) {
      return next(
        ApiError.forbidden(
          `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`
        )
      );
    }

    next();
  };
}
