import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

// Force a reliable public DNS resolver. Node's built-in c-ares resolver
// sometimes cannot reach a home-router DNS for SRV/TXT queries, which are
// required by Atlas's mongodb+srv:// connection strings.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
