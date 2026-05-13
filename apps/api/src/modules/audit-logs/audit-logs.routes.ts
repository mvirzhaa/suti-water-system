import { Router } from 'express';
import { AuditLogController } from './audit-logs.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';

const router = Router();
const controller = new AuditLogController();

// Hanya Pimpinan & Super Admin yang bisa melihat Audit Log
router.get(
  '/',
  verifyJWT,
  checkRole(['PIMPINAN', 'SUPER_ADMIN']),
  (req, res, next) => controller.getAll(req, res, next)
);

export default router;
