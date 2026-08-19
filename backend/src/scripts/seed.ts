import { connectDb, disconnectDb } from '../config/db.js';
import { seedAll } from '../services/seed.service.js';
import { logger } from '../lib/logger.js';

async function main() {
  await connectDb();
  await seedAll();
}

main()
  .then(async () => {
    await disconnectDb();
    logger.info('Seed complete');
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error('Seed failed', err);
    try {
      await disconnectDb();
    } catch {}
    process.exit(1);
  });
