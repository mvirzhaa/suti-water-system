import dotenv from 'dotenv';
import path from 'path';

// Load .env dari root monorepo SEBELUM import apapun yang butuh env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import prisma from './config/database';
import logger from './utils/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import { globalRateLimit } from './middlewares/rateLimit.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import categoryRoutes from './modules/categories/categories.route';
import productRoutes from './modules/products/products.route';
import stockInRoutes from './modules/stock-in/stock-in.routes';
import stockOutRoutes from './modules/stock-out/stock-out.routes';
import discountRoutes from './modules/discounts/discounts.routes';
import auditLogRoutes from './modules/audit-logs/audit-logs.routes';
import dashboardRoutes from './modules/dashboard/dashboard.route';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import agentsRoutes from './modules/agents/agents.routes';
import usersRoutes from './modules/users/users.routes';
import refrigeratorRoutes from './modules/refrigerators/refrigerator.routes';

import './config/passport'; // Inisialisasi passport strategy

const app: Express = express();
const PORT = process.env.PORT ?? 5000;

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') ?? 'http://localhost:3000',
  credentials: true, // Izinkan cookie cross-origin
}));
app.use(globalRateLimit);

// ==========================================
// REQUEST PARSING & LOGGING
// ==========================================
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Wajib untuk baca HttpOnly cookie

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    await prisma.user.count();
    res.status(200).json({
      success: true,
      message: 'Suti Water System API berjalan normal 💧',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API berjalan tapi koneksi database gagal ⚠️',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stock-in', stockInRoutes);
app.use('/api/v1/stock-out', stockOutRoutes);
app.use('/api/v1/discounts', discountRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/agents', agentsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/refrigerators', refrigeratorRoutes);

// ==========================================
// 404 HANDLER
// ==========================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    code: 'NOT_FOUND',
  });
});

// ==========================================
// GLOBAL ERROR HANDLER (harus paling akhir)
// ==========================================
app.use(errorMiddleware);

// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
  logger.info(`🚀 Server berjalan di http://localhost:${PORT}`);
  logger.info(`💧 Health check: http://localhost:${PORT}/api/v1/health`);
  logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});