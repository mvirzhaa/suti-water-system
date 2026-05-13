import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { verifyJWT } from '../../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Harus login untuk lihat dashboard
router.use(verifyJWT);

router.get('/summary', dashboardController.getSummary);

export default router;
