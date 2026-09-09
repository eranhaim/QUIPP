import { Router } from 'express';
import * as endorsements from '../controllers/endorsement.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';

const router = Router();

router.use(authRequired);
router.get('/me', asyncHandler(endorsements.listMine));
router.post('/', asyncHandler(endorsements.create));

export default router;
