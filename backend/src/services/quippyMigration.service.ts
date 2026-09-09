import mongoose from 'mongoose';
import { logger } from '../lib/logger.js';

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';

/**
 * Upgrade the original one-thread-per-user QUIPPY schema in place.
 * This intentionally runs before the HTTP server starts, so a failed index
 * migration cannot leave the application serving against ambiguous threads.
 */
export async function migrateQuippyPersistence(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB is not connected for QUIPPY migration');

  const collections = await db
    .listCollections({ name: CONVERSATIONS }, { nameOnly: true })
    .toArray();
  if (collections.length === 0) {
    await db.createCollection(CONVERSATIONS);
  }

  const conversations = db.collection(CONVERSATIONS);
  await conversations.updateMany(
    { principalKey: { $exists: false } },
    [
      {
        $set: {
          principalKey: { $concat: ['user:', { $toString: '$userId' }] },
          channel: 'web',
          mode: 'equipment',
          title: { $ifNull: ['$title', 'Equipment consultant'] },
          lastMessageAt: { $ifNull: ['$lastMessageAt', '$updatedAt'] },
        },
      },
    ],
  );

  const indexes = await conversations.indexes();
  const oldUniqueUserIndex = indexes.find(
    (index) =>
      index.unique === true &&
      Object.keys(index.key).length === 1 &&
      index.key.userId === 1,
  );
  if (oldUniqueUserIndex?.name) {
    await conversations.dropIndex(oldUniqueUserIndex.name);
  }
  await conversations.createIndex(
    { principalKey: 1, channel: 1, mode: 1 },
    { unique: true, name: 'principalKey_1_channel_1_mode_1' },
  );
  await conversations.createIndex(
    { userId: 1, lastMessageAt: -1 },
    { name: 'userId_1_lastMessageAt_-1' },
  );

  const messageCollections = await db
    .listCollections({ name: MESSAGES }, { nameOnly: true })
    .toArray();
  if (messageCollections.length > 0) {
    const messages = db.collection(MESSAGES);
    await messages.updateMany(
      { channel: { $exists: false } },
      { $set: { channel: 'web' } },
    );
    await messages.updateMany(
      { deliveryStatus: { $exists: false } },
      { $set: { deliveryStatus: 'delivered' } },
    );
    await messages.createIndex(
      { channel: 1, externalMessageId: 1 },
      {
        unique: true,
        name: 'channel_1_externalMessageId_1',
        partialFilterExpression: { externalMessageId: { $type: 'string' } },
      },
    );
  }

  logger.info('QUIPPY persistence migration complete');
}
