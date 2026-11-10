import { Router } from 'express';
import { ingestTelemetry, getDeviceTelemetry } from '../controllers/telemetryController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Endpoint agent ingestion route
router.post('/', ingestTelemetry);

// Dashboard telemetry retrieval route (authenticated users)
router.get('/:deviceId', authenticate, getDeviceTelemetry);

export default router;

