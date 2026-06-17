import { Router } from 'express';
import { KulkasRekapController } from './kulkas-rekap.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createRekapSchema } from './kulkas-rekap.schema';

const router = Router();
const controller = new KulkasRekapController();

// Semua endpoint rekap wajib login.
router.use(verifyJWT);

router.get('/', (req, res, next) => controller.list(req, res, next));
router.post('/', validate(createRekapSchema), (req, res, next) => controller.create(req, res, next));
router.get('/:id', (req, res, next) => controller.detail(req, res, next));

// Hapus rekap dibatasi (mengikuti pola "DELETE = Pimpinan/Admin only").
router.delete(
  '/:id',
  checkRole(['SUPER_ADMIN', 'PIMPINAN']),
  (req, res, next) => controller.remove(req, res, next),
);

export default router;
