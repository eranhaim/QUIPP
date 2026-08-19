import { Router } from 'express';
import health from './health.js';
import auth from './auth.js';
import profile from './profile.js';
import courses from './courses.js';
import enrollments from './enrollments.js';
import credentials from './credentials.js';
import techDeclarations from './techDeclarations.js';
import tags from './tags.js';

const router = Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/profile', profile);
router.use('/courses', courses);
router.use('/enrollments', enrollments);
router.use('/credentials', credentials);
router.use('/tech-declarations', techDeclarations);
router.use('/tags', tags);

export default router;
