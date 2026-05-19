import { Router } from 'express';
import { StockOutController } from './stock-out.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadNotaCloud } from '../../config/cloudinary';
import { createStockOutSchema } from './stock-out.schema';

const router = Router();
const controller = new StockOutController();

router.get('/', verifyJWT, (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', verifyJWT, (req, res, next) => controller.getById(req, res, next));

router.post(
  '/',
  verifyJWT,
  checkRole(['STAFF', 'PIMPINAN', 'SUPER_ADMIN']),
  uploadNotaCloud.single('nota'),
  validate(createStockOutSchema),
  (req, res, next) => controller.create(req, res, next)
);

// Hanya SUPER_ADMIN & PIMPINAN yang bisa menghapus data barang keluar
// Penghapusan akan mengembalikan stok produk secara atomik
router.delete(
  '/:id',
  verifyJWT,
  checkRole(['SUPER_ADMIN', 'PIMPINAN']),
  (req, res, next) => controller.delete(req, res, next)
);

export default router;
