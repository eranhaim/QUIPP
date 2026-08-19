import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { TechnologyTag } from '../models/TechnologyTag.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tags = await TechnologyTag.find({ active: true }).sort({ tagName: 1 }).lean();
    res.json({
      tags: tags.map((t) => ({
        tagName: t.tagName,
        label: t.label,
        icon: t.icon,
        description: t.description,
      })),
    });
  }),
);

export default router;
