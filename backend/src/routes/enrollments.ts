import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import { enroll, myEnrollments } from '../controllers/enrollment.controller.js';

const router = Router();

router.get('/me', authRequired, asyncHandler(myEnrollments));
router.post('/', authRequired, asyncHandler(enroll));

export default router;
