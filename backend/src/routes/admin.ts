import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { adminRequired } from '../middleware/adminRequired.js';
import * as videos from '../controllers/video.controller.js';
import * as courses from '../controllers/adminCourse.controller.js';
import * as deep from '../controllers/deepSubmission.controller.js';

const router = Router();

router.use(adminRequired);

router.get('/courses', asyncHandler(courses.list));
router.post('/courses', asyncHandler(courses.create));
router.get('/courses/:slug', asyncHandler(courses.detail));
router.patch('/courses/:slug', asyncHandler(courses.update));
router.post('/courses/:slug/status', asyncHandler(courses.setStatus));

router.get('/videos', asyncHandler(videos.list));
router.post('/videos', asyncHandler(videos.create));
router.post('/videos/:id/confirm', asyncHandler(videos.confirm));
router.delete('/videos/:id', asyncHandler(videos.remove));
router.get('/videos/:id/playback', asyncHandler(videos.playback));

router.get('/deep-submissions', asyncHandler(deep.listPending));
router.post('/deep-submissions/:id/approve', asyncHandler(deep.approve));
router.post('/deep-submissions/:id/reject', asyncHandler(deep.reject));

export default router;
