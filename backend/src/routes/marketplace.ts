import { Router } from 'express';
import * as marketplace from '../controllers/marketplace.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';

const router = Router();
router.use(authRequired);
router.get('/products', asyncHandler(marketplace.list));
router.get('/products/:slug', asyncHandler(marketplace.detail));
router.get('/offers/:id/click', asyncHandler(marketplace.click));

export default router;
