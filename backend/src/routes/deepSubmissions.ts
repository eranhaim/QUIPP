import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import * as ctrl from '../controllers/deepSubmission.controller.js';

const router = Router();

router.post('/', authRequired, asyncHandler(ctrl.create));
router.get('/me', authRequired, asyncHandler(ctrl.listMine));

export default router;
