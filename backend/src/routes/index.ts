import { Router } from 'express';
import health from './health.js';
import auth from './auth.js';
import profile from './profile.js';
import courses from './courses.js';
import enrollments from './enrollments.js';
import credentials from './credentials.js';
import techDeclarations from './techDeclarations.js';
import tags from './tags.js';
import admin from './admin.js';
import deepSubmissions from './deepSubmissions.js';
import quippy from './quippy.js';

const router = Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/profile', profile);
router.use('/courses', courses);
router.use('/enrollments', enrollments);
router.use('/credentials', credentials);
router.use('/tech-declarations', techDeclarations);
router.use('/tags', tags);
router.use('/admin', admin);
router.use('/deep-submissions', deepSubmissions);
router.use('/quippy', quippy);

export default router;
