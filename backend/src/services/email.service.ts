import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendViaResend(input: SendMailInput): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed: ${res.status} ${body}`);
  }
}

function sendViaConsole(input: SendMailInput): void {
  logger.info(`Email to ${input.to}: ${input.subject}\n${input.text}`);
}

export async function sendMail(input: SendMailInput): Promise<void> {
  if (env.RESEND_API_KEY) {
    await sendViaResend(input);
  } else {
    sendViaConsole(input);
  }
}
