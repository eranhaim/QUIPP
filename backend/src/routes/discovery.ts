import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as controller from '../controllers/discovery.controller.js';

const router = Router();

router.get('/workers', asyncHandler(controller.workers));
router.get('/workers/:username', asyncHandler(controller.workerByUsername));

export default router;
