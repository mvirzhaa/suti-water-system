import { Router } from 'express';
import { RefrigeratorController } from './refrigerator.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createRefrigeratorSchema,
  updateRefrigeratorSchema,
  createFillSchema,
  createWeeklyReportSchema,
} from './refrigerator.schema';

const router = Router();
const controller = new RefrigeratorController();

// Semua endpoint kulkas wajib login.
router.use(verifyJWT);

// --- Ringkasan & daftar ------------------------------------------------------
// `/summary` harus didaftarkan sebelum `/:id` agar tidak tertangkap param.
router.get('/summary', (req, res, next) => controller.summary(req, res, next));
router.get('/', (req, res, next) => controller.list(req, res, next));

// --- Master kulkas -----------------------------------------------------------
// Membuat & memperbarui kulkas boleh oleh semua role (operasional harian).
router.post('/', validate(createRefrigeratorSchema), (req, res, next) => controller.create(req, res, next));
router.put('/:id', validate(updateRefrigeratorSchema), (req, res, next) => controller.update(req, res, next));

// Hapus kulkas dibatasi (mengikuti pola "DELETE = Pimpinan/Admin only").
router.delete('/:id', checkRole(['SUPER_ADMIN', 'PIMPINAN']), (req, res, next) => controller.remove(req, res, next));

router.get('/:id', (req, res, next) => controller.detail(req, res, next));

// --- Pengisian (fill) --------------------------------------------------------
router.post('/:id/fills', validate(createFillSchema), (req, res, next) => controller.createFill(req, res, next));
router.get('/:id/fills', (req, res, next) => controller.listFills(req, res, next));
router.delete(
  '/:id/fills/:fillId',
  checkRole(['SUPER_ADMIN', 'PIMPINAN']),
  (req, res, next) => controller.removeFill(req, res, next),
);

// --- Rekap pekanan / bagi hasil ---------------------------------------------
router.get('/:id/recap-preview', (req, res, next) => controller.recapPreview(req, res, next));
router.post('/:id/reports', validate(createWeeklyReportSchema), (req, res, next) => controller.createReport(req, res, next));
router.get('/:id/reports', (req, res, next) => controller.listReports(req, res, next));
router.delete(
  '/:id/reports/:reportId',
  checkRole(['SUPER_ADMIN', 'PIMPINAN']),
  (req, res, next) => controller.removeReport(req, res, next),
);

export default router;
