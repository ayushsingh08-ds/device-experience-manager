import { Router } from 'express';
import {
  registerDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} from '../controllers/deviceController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all device endpoints
router.use(authenticate);

// View devices (ADMIN, OPERATOR, VIEWER)
router.get('/', getDevices);
router.get('/:id', getDeviceById);

// Manage devices (ADMIN, OPERATOR)
router.post('/register', authorize('ADMIN', 'OPERATOR'), registerDevice);
router.patch('/:id', authorize('ADMIN', 'OPERATOR'), updateDevice);

// Decommission device (ADMIN only)
router.delete('/:id', authorize('ADMIN'), deleteDevice);

export default router;
