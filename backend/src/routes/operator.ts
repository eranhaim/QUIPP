import { Router } from 'express';
import {
  acceptLink,
  addAssignment,
  addLocation,
  addRequirement,
  assignments,
  declineLink,
  invite,
  locations,
  me,
  myWorkplaces,
  overview,
  requirements,
  roster,
  setup,
  unlink,
} from '../controllers/operator.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authRequired } from '../middleware/authRequired.js';
import * as coursePacks from '../controllers/coursePack.controller.js';
import * as operatorCourses from '../controllers/operatorCourse.controller.js';
import * as operatorVideos from '../controllers/operatorVideo.controller.js';
import * as endorsements from '../controllers/endorsement.controller.js';

const router = Router();

router.use(authRequired);

router.post('/setup', asyncHandler(setup));
router.get('/me', asyncHandler(me));
router.get('/overview', asyncHandler(overview));
router.get('/locations', asyncHandler(locations));
router.post('/locations', asyncHandler(addLocation));
router.get('/roster', asyncHandler(roster));
router.get('/workplace/me', asyncHandler(myWorkplaces));
router.post('/workplace/invite', asyncHandler(invite));
router.post('/workplace/:id/accept', asyncHandler(acceptLink));
router.post('/workplace/:id/decline', asyncHandler(declineLink));
router.post('/workplace/:id/unlink', asyncHandler(unlink));
router.get('/requirements', asyncHandler(requirements));
router.post('/requirements', asyncHandler(addRequirement));
router.get('/assignments', asyncHandler(assignments));
router.post('/assignments', asyncHandler(addAssignment));
router.get('/endorsements', asyncHandler(endorsements.listForOperator));
router.post('/endorsements/:id/approve', asyncHandler(endorsements.approve));
router.post('/endorsements/:id/reject', asyncHandler(endorsements.reject));
router.post('/course-packs/checkout', asyncHandler(coursePacks.checkout));
router.get('/course-packs', asyncHandler(coursePacks.list));
router.post('/course-packs/:packId/assign', asyncHandler(coursePacks.assign));
router.get('/courses', asyncHandler(operatorCourses.list));
router.post('/courses', asyncHandler(operatorCourses.create));
router.patch('/courses/:id', asyncHandler(operatorCourses.update));
router.post('/courses/:id/submit', asyncHandler(operatorCourses.submit));
router.get('/videos', asyncHandler(operatorVideos.list));
router.post('/videos', asyncHandler(operatorVideos.create));
router.post('/videos/:id/confirm', asyncHandler(operatorVideos.confirm));
router.delete('/videos/:id', asyncHandler(operatorVideos.remove));

export default router;
