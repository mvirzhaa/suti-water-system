import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from './categories.controller';

import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCategorySchema } from './categories.schema';

const router = Router();

// Staff, Pimpinan, Super Admin bisa melihat kategori
router.get('/', verifyJWT, getCategories);

// Hanya Pimpinan & Super Admin yang bisa membuat kategori baru
router.post(
  '/',
  verifyJWT,
  checkRole(['PIMPINAN', 'SUPER_ADMIN']),
  validate(createCategorySchema),
  createCategory
);

// Hanya Super Admin yang bisa menghapus kategori
router.delete(
  '/:id',
  verifyJWT,
  checkRole(['SUPER_ADMIN']),
  deleteCategory
);

export default router;