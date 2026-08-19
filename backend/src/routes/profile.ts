import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import { me, byUsername, updateMe } from '../controllers/profile.controller.js';

const router = Router();

router.get('/me', authRequired, asyncHandler(me));
router.patch('/me', authRequired, asyncHandler(updateMe));
router.get('/username/:username', asyncHandler(byUsername));

export default router;
