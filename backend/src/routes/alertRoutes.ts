import { Router } from 'express';
import { getAlerts, updateAlertStatus } from '../controllers/alertController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All alert endpoints require authentication
router.use(authenticate);

// View alerts (ADMIN, OPERATOR, VIEWER)
router.get('/', getAlerts);

// Update alert status (ADMIN, OPERATOR)
router.patch('/:id/status', authorize('ADMIN', 'OPERATOR'), updateAlertStatus);

export default router;
