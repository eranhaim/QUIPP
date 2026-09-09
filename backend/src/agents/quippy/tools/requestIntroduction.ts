import { createIntroduction } from '../../../services/introduction.service.js';

export interface IntroductionToolResult {
  ok: boolean;
  status?: string;
  candidateUsername?: string;
  error?: string;
}

export async function requestIntroduction(
  userId: string,
  candidateUsername: string,
  purpose: string,
): Promise<IntroductionToolResult> {
  try {
    const introduction = await createIntroduction({
      requesterUserId: userId,
      candidateUsername,
      purpose,
      approvedChannel: 'email',
    });
    return {
      ok: true,
      status: introduction.status,
      candidateUsername: introduction.counterpart.username,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create introduction';
    return {
      ok: false,
      error: message,
      candidateUsername,
    };
  }
}
