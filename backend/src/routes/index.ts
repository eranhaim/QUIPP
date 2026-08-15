import { Router } from 'express';
import health from './health.js';
import auth from './auth.js';

const router = Router();

router.use('/health', health);
router.use('/auth', auth);

export default router;
