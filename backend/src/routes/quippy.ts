import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import * as ctrl from '../controllers/quippy.controller.js';

const router = Router();

router.get('/status', authRequired, asyncHandler(ctrl.status));
router.get(
  '/channels/greenapi/status',
  authRequired,
  asyncHandler(ctrl.greenApiStatus),
);
router.post(
  '/channels/greenapi/link-code',
  authRequired,
  asyncHandler(ctrl.createGreenApiLinkCode),
);
router.get('/conversation', authRequired, asyncHandler(ctrl.conversation));
router.post('/message', authRequired, asyncHandler(ctrl.sendMessage));
router.get('/profile', authRequired, asyncHandler(ctrl.profile));
router.patch('/profile', authRequired, asyncHandler(ctrl.updateProfile));

export default router;
