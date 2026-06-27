import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Global rate limiter: 100 request/menit per IP
 */
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Terlalu banyak permintaan, coba lagi dalam 1 menit',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Login rate limiter: 5 percobaan per 15 menit per IP
 * Sesuai spesifikasi keamanan
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 50, // Temporarily increased for development
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Hitung hanya request yang gagal
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Terlalu banyak percobaan login. Coba lagi setelah 15 menit',
      429,
      'LOGIN_RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Register rate limiter: 3 akun per jam per IP
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Terlalu banyak pendaftaran dari IP ini. Coba lagi setelah 1 jam',
      429,
      'REGISTER_RATE_LIMIT_EXCEEDED'
    );
  },
});
