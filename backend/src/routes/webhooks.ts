import { Router } from 'express';
import { greenApiWebhook } from '../controllers/greenApiWebhook.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.post('/green-api/:instanceId', asyncHandler(greenApiWebhook));

export default router;
