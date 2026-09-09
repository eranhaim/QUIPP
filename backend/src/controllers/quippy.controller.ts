import type { Request, Response } from 'express';
import { z } from 'zod';
import { fetchConversation, streamReply, isQuippyConfigured } from '../services/quippy.service.js';
import {
  getQuippyProfile,
  saveQuippyProfile,
} from '../services/quippyProfile.service.js';
import { env } from '../config/env.js';
import { greenApiClient } from '../services/greenApi.client.js';
import { greenApiWorker } from '../services/greenApiWorker.service.js';
import { createWhatsAppLinkCode } from '../services/whatsAppLink.service.js';

export async function conversation(req: Request, res: Response) {
  const data = await fetchConversation(req.auth!.sub);
  res.json(data);
}

const messageSchema = z.object({ content: z.string().min(1).max(2000) });

export async function sendMessage(req: Request, res: Response) {
  const { content } = messageSchema.parse(req.body);
  await streamReply(req.auth!.sub, content, res, req.requestId);
}

export async function status(_req: Request, res: Response) {
  res.json({ configured: isQuippyConfigured() });
}

export async function greenApiStatus(_req: Request, res: Response) {
  res.json({
    configured: greenApiClient.isConfigured(),
    enabled: env.GREEN_API_ENABLED,
    worker: greenApiWorker.getState(),
  });
}

export async function createGreenApiLinkCode(req: Request, res: Response) {
  res.status(201).json(await createWhatsAppLinkCode(req.auth!.sub));
}

const factValueSchema = z.union([
  z.string().max(500),
  z.number(),
  z.array(z.string().max(200)).max(30),
  z.null(),
]);

const profileSchema = z.object({
  audience: z.enum(['unknown', 'worker', 'operator', 'supplier']).optional(),
  language: z.string().trim().min(2).max(20).optional(),
  onboardingStage: z.string().trim().min(1).max(80).optional(),
  completed: z.boolean().optional(),
  facts: z.record(factValueSchema).optional(),
});

export async function profile(req: Request, res: Response) {
  res.json({ profile: await getQuippyProfile(req.auth!.sub) });
}

export async function updateProfile(req: Request, res: Response) {
  const input = profileSchema.parse(req.body);
  res.json({ profile: await saveQuippyProfile(req.auth!.sub, input) });
}
