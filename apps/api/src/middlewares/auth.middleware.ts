import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/generateToken';
import { ApiError } from '../utils/ApiError';

// Extend Express Request untuk menyimpan data user yang sudah terautentikasi
declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

/**
 * Middleware: Verifikasi JWT Access Token dari Authorization header
 * Format: "Authorization: Bearer <token>"
 */
export function verifyJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Token tidak ditemukan'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(ApiError.unauthorized('Token tidak valid'));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token sudah kadaluarsa', 'TOKEN_EXPIRED'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Token tidak valid', 'INVALID_TOKEN'));
    }
    next(ApiError.unauthorized('Autentikasi gagal'));
  }
}

/**
 * Middleware: Otorisasi berdasarkan role
 * @param roles List role yang diizinkan (SUPER_ADMIN, PIMPINAN, STAFF)
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User tidak terautentikasi'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Anda tidak memiliki izin untuk melakukan aksi ini'));
    }

    next();
  };
}
