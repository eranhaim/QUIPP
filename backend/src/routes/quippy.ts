import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import * as ctrl from '../controllers/quippy.controller.js';

const router = Router();

router.get('/status', authRequired, asyncHandler(ctrl.status));
router.get('/conversation', authRequired, asyncHandler(ctrl.conversation));
router.post('/message', authRequired, asyncHandler(ctrl.sendMessage));

export default router;
