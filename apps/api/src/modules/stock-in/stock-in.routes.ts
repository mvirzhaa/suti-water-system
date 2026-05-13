import { Router } from 'express';
import { StockInController } from './stock-in.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createStockInSchema } from './stock-in.schema';

const router = Router();
const controller = new StockInController();

// Semua staff ke atas bisa melihat riwayat barang masuk
router.get('/', verifyJWT, (req, res, next) => controller.getAll(req, res, next));

// Hanya Staff, Pimpinan & Super Admin yang bisa input barang masuk
router.post(
  '/',
  verifyJWT,
  checkRole(['STAFF', 'PIMPINAN', 'SUPER_ADMIN']),
  validate(createStockInSchema),
  (req, res, next) => controller.create(req, res, next)
);

export default router;
