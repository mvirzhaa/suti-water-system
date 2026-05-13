import { Router } from 'express';
import { UsersController } from './users.controller';
import { verifyJWT, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new UsersController();

// Semua route user dilindungi JWT
router.use(verifyJWT);

router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));

// Hanya SUPER_ADMIN & PIMPINAN yang bisa menambah/edit/hapus user
router.post('/', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.create(req, res, next));
router.patch('/:id', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.update(req, res, next));
router.delete('/:id', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.delete(req, res, next));

export default router;
