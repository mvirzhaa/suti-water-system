import { Router } from 'express';
import { StockOutController } from './stock-out.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createStockOutSchema } from './stock-out.schema';

const router = Router();
const controller = new StockOutController();

router.get('/', verifyJWT, (req, res, next) => controller.getAll(req, res, next));

router.post(
  '/',
  verifyJWT,
  checkRole(['STAFF', 'PIMPINAN', 'SUPER_ADMIN']),
  validate(createStockOutSchema),
  (req, res, next) => controller.create(req, res, next)
);

export default router;
