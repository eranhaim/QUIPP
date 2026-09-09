import type { Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import {
  constructStripeEvent,
  handleStripeEvent,
} from '../services/coursePack.service.js';

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.header('stripe-signature');
  if (!signature) throw new HttpError(400, 'Missing Stripe signature');
  if (!Buffer.isBuffer(req.body)) throw new HttpError(400, 'Stripe webhook requires raw body');
  const event = constructStripeEvent(req.body, signature);
  await handleStripeEvent(event);
  res.json({ received: true });
}
