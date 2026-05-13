import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../utils/generateToken';
import type { RegisterDto, LoginDto } from './auth.schema';

const BCRYPT_ROUNDS = 12;

// Kolom yang aman untuk dikembalikan ke client (tidak include password)
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export class AuthService {
  /**
   * Daftarkan user baru
   * - Cek email duplikat
   * - Hash password dengan bcrypt (cost factor 12)
   * - Return user tanpa password
   */
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw ApiError.conflict('Email sudah terdaftar', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        phone: dto.phone,
      },
      select: SAFE_USER_SELECT,
    });

    return user;
  }

  /**
   * Login dengan email + password
   * - Verifikasi credentials
   * - Generate access token (15m) + refresh token (7d)
   * - Simpan hash refresh token ke DB
   * - Update lastLoginAt
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    // Selalu bandingkan password meski user tidak ada (prevent timing attack)
    const dummyHash = '$2b$12$dummyhashfortiminprotection.padding';
    const passwordToCompare = user?.password ?? dummyHash;

    const isPasswordValid = await bcrypt.compare(dto.password, passwordToCompare);

    if (!user || !isPasswordValid) {
      throw ApiError.unauthorized('Email atau password salah', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Akun Anda telah dinonaktifkan. Hubungi administrator', 'ACCOUNT_INACTIVE');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Simpan refresh token & update lastLoginAt secara paralel
    await Promise.all([
      saveRefreshToken(user.id, refreshToken, ipAddress, userAgent),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Logout: revoke refresh token dari DB
   */
  async logout(refreshToken: string): Promise<void> {
    await revokeRefreshToken(refreshToken);
  }

  /**
   * Refresh access token menggunakan refresh token yang valid
   */
  async refresh(refreshToken: string) {
    // 1. Verifikasi signature JWT
    let payload: { userId: string; email: string; role: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Refresh token tidak valid atau kadaluarsa', 'INVALID_REFRESH_TOKEN');
    }

    // 2. Cek apakah token ada di DB dan belum direvoke
    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token tidak valid atau sudah digunakan', 'INVALID_REFRESH_TOKEN');
    }

    // 3. Cek user masih aktif
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true, deletedAt: null },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Akun tidak ditemukan atau tidak aktif', 'ACCOUNT_INACTIVE');
    }

    // 4. Issue access token baru
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  /**
   * Get profil user yang sedang login
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw ApiError.notFound('User tidak ditemukan');
    }

    return user;
  }

  /**
   * Update profil sendiri
   */
  async updateMe(userId: string, data: { name?: string; phone?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: SAFE_USER_SELECT,
    });
    return user;
  }

  /**
   * Ubah password sendiri
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) {
      throw ApiError.badRequest('Akun ini tidak menggunakan password (login via Google)');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw ApiError.unauthorized('Password lama tidak sesuai', 'WRONG_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });
  }
}
