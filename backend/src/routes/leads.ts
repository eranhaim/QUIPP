import { Router } from 'express';
import * as leads from '../controllers/lead.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';

const router = Router();
router.use(authRequired);
router.post('/', asyncHandler(leads.create));
router.get('/me', asyncHandler(leads.mine));
router.post('/:id/cancel', asyncHandler(leads.cancel));
router.get('/:leadId/proposals', asyncHandler(leads.proposals));
router.post(
  '/:leadId/proposals/:proposalId/accept',
  asyncHandler(leads.accept),
);

export default router;
