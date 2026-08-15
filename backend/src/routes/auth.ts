import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import {
  register,
  login,
  logout,
  refresh,
  verifyEmail,
  startPasswordReset,
  completePasswordReset,
  me,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/refresh', asyncHandler(refresh));
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/password/reset-request', asyncHandler(startPasswordReset));
router.post('/password/reset', asyncHandler(completePasswordReset));
router.get('/me', authRequired, asyncHandler(me));

export default router;
