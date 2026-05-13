import { Router } from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';

import { validate } from '../../middlewares/validate.middleware';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { loginRateLimit, registerRateLimit } from '../../middlewares/rateLimit.middleware';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from './auth.schema';

const router = Router();
const controller = new AuthController();

// ==========================================
// PUBLIC ROUTES (tanpa autentikasi)
// ==========================================

// POST /api/v1/auth/register — Daftar akun baru
router.post(
  '/register',
  registerRateLimit,
  validate(registerSchema),
  (req, res, next) => controller.register(req, res, next)
);

// POST /api/v1/auth/login — Login & dapatkan token
router.post(
  '/login',
  loginRateLimit,
  validate(loginSchema),
  (req, res, next) => controller.login(req, res, next)
);

// POST /api/v1/auth/refresh — Refresh access token via cookie
router.post(
  '/refresh',
  (req, res, next) => controller.refresh(req, res, next)
);

// --- Google OAuth ---
// GET /api/v1/auth/google — Mulai login Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/v1/auth/google/callback — Callback setelah login Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res, next) => controller.googleCallback(req, res, next)
);

// ==========================================

// PROTECTED ROUTES (butuh access token)
// ==========================================

// POST /api/v1/auth/logout — Logout & revoke refresh token
router.post(
  '/logout',
  verifyJWT,
  (req, res, next) => controller.logout(req, res, next)
);

// GET /api/v1/auth/me — Get profil sendiri
router.get(
  '/me',
  verifyJWT,
  (req, res, next) => controller.getMe(req, res, next)
);

// PATCH /api/v1/auth/me — Update profil sendiri
router.patch(
  '/me',
  verifyJWT,
  validate(updateProfileSchema),
  (req, res, next) => controller.updateMe(req, res, next)
);

// PATCH /api/v1/auth/change-password — Ubah password sendiri
router.patch(
  '/change-password',
  verifyJWT,
  validate(changePasswordSchema),
  (req, res, next) => controller.changePassword(req, res, next)
);

export default router;
