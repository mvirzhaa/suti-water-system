import { Router } from 'express';
import { StockInController } from './stock-in.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadNotaCloud } from '../../config/cloudinary';
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
  uploadNotaCloud.single('nota'), // Handle multipart form-data & upload to Cloudinary
  validate(createStockInSchema),
  (req, res, next) => controller.create(req, res, next)
);

// Hanya SUPER_ADMIN & PIMPINAN yang bisa menghapus data barang masuk
// Penghapusan akan mengembalikan stok produk secara atomik
router.delete(
  '/:id',
  verifyJWT,
  checkRole(['SUPER_ADMIN', 'PIMPINAN']),
  (req, res, next) => controller.delete(req, res, next)
);

export default router;
