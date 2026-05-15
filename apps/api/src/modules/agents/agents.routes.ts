import { Router } from 'express';
import { AgentsController } from './agents.controller';
import { verifyJWT, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AgentsController();

// Semua route agen dilindungi JWT
router.use(verifyJWT);

// Semua role bisa melihat data agen
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));

// Hanya SUPER_ADMIN & PIMPINAN yang bisa tambah/edit/hapus agen
router.post('/', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.create(req, res, next));
router.put('/:id', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.update(req, res, next));
router.delete('/:id', authorize('SUPER_ADMIN', 'PIMPINAN'), (req, res, next) => controller.delete(req, res, next));

export default router;
