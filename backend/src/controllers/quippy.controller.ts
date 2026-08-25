import type { Request, Response } from 'express';
import { z } from 'zod';
import { fetchConversation, streamReply, isQuippyConfigured } from '../services/quippy.service.js';

export async function conversation(req: Request, res: Response) {
  const data = await fetchConversation(req.auth!.sub);
  res.json(data);
}

const messageSchema = z.object({ content: z.string().min(1).max(2000) });

export async function sendMessage(req: Request, res: Response) {
  const { content } = messageSchema.parse(req.body);
  await streamReply(req.auth!.sub, content, res);
}

export async function status(_req: Request, res: Response) {
  res.json({ configured: isQuippyConfigured() });
}
