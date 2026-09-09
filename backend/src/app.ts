import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { asyncHandler } from './lib/asyncHandler.js';
import { stripeWebhook } from './controllers/stripeWebhook.controller.js';
import { requestContext } from './middleware/requestContext.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestContext);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    asyncHandler(stripeWebhook),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', routes);

  app.use(errorHandler);
  return app;
}
