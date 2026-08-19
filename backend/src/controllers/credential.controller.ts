import type { Request, Response } from 'express';
import {
  listCredentialsForUser,
  listCredentialsByUsername,
  verifyCredentialById,
} from '../services/credential.service.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function mine(req: Request, res: Response) {
  if (!req.auth) throw new HttpError(401, 'Not authenticated');
  const credentials = await listCredentialsForUser(req.auth.sub);
  res.json({ credentials });
}

export async function byUsername(req: Request, res: Response) {
  const credentials = await listCredentialsByUsername(req.params.username);
  res.json({ credentials });
}

export async function verify(req: Request, res: Response) {
  const result = await verifyCredentialById(req.params.verificationId);
  res.json(result);
}
