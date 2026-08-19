import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import { list, bySlug } from '../controllers/course.controller.js';
import { enroll, submitQuiz } from '../controllers/enrollment.controller.js';

const router = Router();

router.get('/', authRequired, asyncHandler(list));
router.get('/:slug', authRequired, asyncHandler(bySlug));
router.post('/:slug/enroll', authRequired, asyncHandler((req, res) => {
  req.body = { courseSlug: req.params.slug };
  return enroll(req, res);
}));
router.post('/:slug/submit', authRequired, asyncHandler(submitQuiz));

export default router;
