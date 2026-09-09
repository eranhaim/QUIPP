import { Router } from 'express';
import * as supplier from '../controllers/supplierMarketplace.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired, requireRole } from '../middleware/authRequired.js';

const router = Router();
router.use(authRequired, requireRole('supplier'));
router.get('/leads', asyncHandler(supplier.leads));
router.post('/leads/:id/proposals', asyncHandler(supplier.propose));
router.get('/proposals', asyncHandler(supplier.proposals));

export default router;
