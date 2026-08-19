import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import { mine, byUsername, verify } from '../controllers/credential.controller.js';

const router = Router();

router.get('/me', authRequired, asyncHandler(mine));
router.get('/user/:username', asyncHandler(byUsername));
router.get('/verify/:verificationId', asyncHandler(verify));

export default router;
