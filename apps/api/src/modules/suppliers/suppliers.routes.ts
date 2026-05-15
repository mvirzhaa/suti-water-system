import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { verifyJWT, authorize } from '../../middlewares/auth.middleware';
import { uploadProductPhoto } from '../../config/cloudinary';

const router = Router();
const controller = new SuppliersController();

// Semua route pemasok dilindungi JWT
router.use(verifyJWT);

// Semua role bisa melihat data pemasok
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));

// Hanya SUPER_ADMIN & PIMPINAN yang bisa tambah/edit/hapus pemasok
// uploadProductPhoto.single('image') — opsional, jika tidak ada file tetap lanjut
router.post(
  '/',
  authorize('SUPER_ADMIN', 'PIMPINAN'),
  uploadProductPhoto.single('image'),
  (req, res, next) => controller.create(req, res, next)
);
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'PIMPINAN'),
  uploadProductPhoto.single('image'),
  (req, res, next) => controller.update(req, res, next)
);
router.delete('/:id', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.delete(req, res, next));

export default router;
