import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route: returns current authenticated user profile
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    user: req.user,
  });
});

export default router;
