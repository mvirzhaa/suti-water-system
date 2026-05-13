import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import prisma from '../../config/database';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  saveRefreshToken 
} from '../../utils/generateToken';

const authService = new AuthService();

// Cookie config untuk refresh token (HttpOnly, Secure di production)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari dalam ms
  path: '/api/v1/auth',
};

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.register(req.body);
      ApiResponse.created(res, user, 'Registrasi berhasil');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
        ipAddress,
        userAgent
      );

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
      ApiResponse.success(res, { user, accessToken }, 'Login berhasil');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      ApiResponse.success(res, null, 'Logout berhasil');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token tidak ditemukan',
          code: 'NO_REFRESH_TOKEN',
        });
        return;
      }
      const { accessToken } = await authService.refresh(refreshToken);
      ApiResponse.success(res, { accessToken }, 'Token berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      ApiResponse.success(res, user, 'Data profil berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/auth/me
   */
  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.updateMe(req.user!.userId, req.body);
      ApiResponse.success(res, user, 'Profil berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      ApiResponse.success(res, null, 'Password berhasil diubah');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/google/callback
   */
  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      if (!user) {
        return next({ statusCode: 401, message: 'Gagal autentikasi Google' });
      }

      if (!user.isActive) {
        return next({ statusCode: 403, message: 'Akun dinonaktifkan', code: 'ACCOUNT_INACTIVE' });
      }

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const ipAddress = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await Promise.all([
        saveRefreshToken(user.id, refreshToken, ipAddress, userAgent),
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }),
      ]);

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
      
      // Redirect ke frontend
      const frontendRedirectUrl = `${process.env.FRONTEND_URL}/auth/callback#token=${accessToken}`;
      res.redirect(frontendRedirectUrl);
    } catch (err) {
      next(err);
    }
  }
}
