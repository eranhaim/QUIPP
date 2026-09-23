import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalBoolean = z.preprocess(
  (value) => {
    if (value === undefined || value === '') return false;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  },
  z.boolean(),
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  CORS_ORIGIN: z.string().min(1).default('http://localhost:8080'),
  APP_URL: z.string().url().default('http://localhost:8080'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('QUIPP <noreply@quipp.co>'),

  // Stripe — optional at boot; checkout/webhooks fail cleanly if missing.
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  STRIPE_CURRENCY: z.string().trim().min(3).max(3).toLowerCase().default('cad'),

  // AWS S3 — optional at boot; video upload/playback fails cleanly if missing.
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Anthropic — optional at boot; QUIPPY endpoint returns "warming up" if missing.
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  // GreenAPI — optional at boot. The worker only starts when enabled and fully configured.
  GREEN_API_ID_INSTANCE: optionalNonEmptyString,
  GREEN_API_TOKEN_INSTANCE: optionalNonEmptyString,
  GREEN_API_API_URL: z.string().url().default('https://api.green-api.com'),
  GREEN_API_WEBHOOK_TOKEN: optionalNonEmptyString,
  GREEN_API_ENABLED: optionalBoolean,
  // Enables the unauthenticated course-lead flow for the configured QUIPP GreenAPI instance.
  // When false, inbound WhatsApp messages continue to use the account-linked QUIPPY flow.
  GREEN_API_LEAD_BOT_ENABLED: optionalBoolean,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
