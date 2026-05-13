import { Router } from 'express';
import { DiscountController } from './discounts.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createDiscountSchema, updateDiscountSchema } from './discounts.schema';

const router = Router();
const controller = new DiscountController();

// Staff, Pimpinan, Admin bisa lihat diskon
router.get('/', verifyJWT, (req, res, next) => controller.getAll(req, res, next));

// Hanya Pimpinan & Admin yang bisa kelola diskon
router.post(
  '/',
  verifyJWT,
  checkRole(['PIMPINAN', 'SUPER_ADMIN']),
  validate(createDiscountSchema),
  (req, res, next) => controller.create(req, res, next)
);

router.patch(
  '/:id',
  verifyJWT,
  checkRole(['PIMPINAN', 'SUPER_ADMIN']),
  validate(updateDiscountSchema),
  (req, res, next) => controller.update(req, res, next)
);

router.delete(
  '/:id',
  verifyJWT,
  checkRole(['SUPER_ADMIN']),
  (req, res, next) => controller.delete(req, res, next)
);

export default router;
