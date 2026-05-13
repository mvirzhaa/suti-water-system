import { Router } from 'express';
import { getCategories, createCategory } from './categories.controller';

import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { categorySchema } from '../categories/categories.schema';

const router = Router();

// Staff, Pimpinan, Super Admin bisa melihat kategori
router.get('/',  verifyJWT,  getCategories);

// Hanya Pimpinan & Super Admin yang bisa membuat kategori baru
router.post(
  '/', 
  verifyJWT, checkRole(['PIMPINAN', 'SUPER_ADMIN']), validate(categorySchema), 
  createCategory
);

export default router;