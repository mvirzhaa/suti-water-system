import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES ?? '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate signed JWT access token (short-lived, 15m)
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    issuer: 'suti-water-system',
  });
}

/**
 * Generate signed JWT refresh token (long-lived, 7d)
 * Simpan hash-nya ke database (bukan token aslinya)
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    issuer: 'suti-water-system',
  });
}

/**
 * Hash token menggunakan SHA-256 sebelum disimpan ke DB
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifikasi access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

/**
 * Verifikasi refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

/**
 * Simpan refresh token ke database (yang disimpan hanya hashnya)
 */
export async function saveRefreshToken(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const tokenHash = hashToken(token);

  // Kalkulasi waktu expire dari REFRESH_EXPIRES (e.g., "7d" → 7 hari)
  const expiresAt = new Date();
  const days = parseInt(REFRESH_EXPIRES.replace('d', ''), 10) || 7;
  expiresAt.setDate(expiresAt.getDate() + days);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Revoke refresh token (set revoked = true)
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
}

/**
 * Revoke semua refresh token milik user (logout dari semua device)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
