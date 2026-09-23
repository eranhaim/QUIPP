import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  WHATSAPP_COURSE_LEAD_STAGES,
  WhatsAppCourseLead,
} from '../models/WhatsAppCourseLead.js';

export async function list(_req: Request, res: Response) {
  const leads = await WhatsAppCourseLead.find({})
    .sort({ lastInboundAt: -1 })
    .limit(200)
    .lean();
  res.json({
    leads: leads.map((lead) => ({
      id: String(lead._id),
      phone: lead.phone,
      senderName: lead.senderName,
      stage: lead.stage,
      qualificationStep: lead.qualificationStep,
      courseSlug: lead.courseSlug,
      learningGoal: lead.learningGoal,
      experience: lead.experience,
      contactName: lead.contactName,
      email: lead.email,
      escalationRequestedAt: lead.escalationRequestedAt,
      lastInboundAt: lead.lastInboundAt,
      createdAt: lead.createdAt,
    })),
  });
}

const updateSchema = z.object({
  stage: z.enum(WHATSAPP_COURSE_LEAD_STAGES),
});

export async function update(req: Request, res: Response) {
  const { stage } = updateSchema.parse(req.body);
  const lead = await WhatsAppCourseLead.findByIdAndUpdate(
    req.params.id,
    { $set: { stage } },
    { new: true },
  ).lean();
  if (!lead) {
    res.status(404).json({ error: 'WhatsApp course lead not found' });
    return;
  }
  res.json({ lead: { id: String(lead._id), stage: lead.stage } });
}
