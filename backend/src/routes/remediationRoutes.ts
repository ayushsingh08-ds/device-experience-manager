import { Router } from 'express';
import {
  createRemediation,
  getRemediations,
  approveAndExecute,
  rejectRemediation,
} from '../controllers/remediationController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// List remediation jobs
router.get('/', getRemediations);

// Request a remediation (ADMIN, OPERATOR)
router.post('/', authorize('ADMIN', 'OPERATOR'), createRemediation);

// Approve & execute remediation simulation (ADMIN, OPERATOR)
router.post('/:id/approve', authorize('ADMIN', 'OPERATOR'), approveAndExecute);

// Reject remediation (ADMIN)
router.post('/:id/reject', authorize('ADMIN'), rejectRemediation);

export default router;
