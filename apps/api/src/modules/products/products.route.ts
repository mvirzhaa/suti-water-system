import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from './products.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router();

// Semua user terautentikasi bisa melihat produk
router.get('/', verifyJWT, getProducts);

// Hanya Pimpinan & Super Admin yang bisa membuat produk
router.post(
  '/',
  verifyJWT,
  checkRole(['PIMPINAN', 'SUPER_ADMIN']),
  validate(createProductSchema),
  createProduct
);

// Hanya Pimpinan & Super Admin yang bisa update produk
router.put(
  '/:id',
  verifyJWT,
  checkRole(['PIMPINAN', 'SUPER_ADMIN']),
  validate(updateProductSchema),
  updateProduct
);

// Hanya Super Admin yang bisa menghapus produk
router.delete(
  '/:id',
  verifyJWT,
  checkRole(['SUPER_ADMIN']),
  deleteProduct
);

export default router;