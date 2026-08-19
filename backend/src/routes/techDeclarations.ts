import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import { list, create, bulk, remove } from '../controllers/techDeclaration.controller.js';

const router = Router();

router.get('/me', authRequired, asyncHandler(list));
router.post('/', authRequired, asyncHandler(create));
router.post('/bulk', authRequired, asyncHandler(bulk));
router.delete('/:id', authRequired, asyncHandler(remove));

export default router;
