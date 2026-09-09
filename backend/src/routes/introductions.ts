import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import * as controller from '../controllers/introduction.controller.js';

const router = Router();

router.use(authRequired);
router.post('/', asyncHandler(controller.create));
router.get('/me', asyncHandler(controller.me));
router.post('/:id/accept', asyncHandler(controller.accept));
router.post('/:id/decline', asyncHandler(controller.decline));
router.post('/:id/cancel', asyncHandler(controller.cancel));
router.post('/:id/report', asyncHandler(controller.report));
router.post('/:id/outcome', asyncHandler(controller.outcome));

export default router;
