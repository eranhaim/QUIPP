import { randomUUID } from 'crypto';
import { Schema, model, type InferSchemaType } from 'mongoose';

const agentUsageSchema = new Schema(
  {
    principalKey: { type: String, required: true, unique: true, trim: true },
    timestamps: { type: [Date], default: [] },
    lastAcceptedToken: { type: String, default: null },
  },
  { timestamps: true },
);

export type AgentUsageDoc = InferSchemaType<typeof agentUsageSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AgentUsage = model('AgentUsage', agentUsageSchema);

export async function consumeAgentRateLimit(
  principalKey: string,
  maxRequests = 30,
  windowMs = 60 * 60 * 1000,
): Promise<boolean> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);
  const token = randomUUID();

  const usage = await AgentUsage.findOneAndUpdate(
    { principalKey },
    [
      {
        $set: {
          principalKey,
          timestamps: {
            $filter: {
              input: { $ifNull: ['$timestamps', []] },
              as: 'timestamp',
              cond: { $gte: ['$$timestamp', cutoff] },
            },
          },
        },
      },
      {
        $set: {
          lastAcceptedToken: {
            $cond: [
              { $lt: [{ $size: '$timestamps' }, maxRequests] },
              token,
              '$lastAcceptedToken',
            ],
          },
          timestamps: {
            $cond: [
              { $lt: [{ $size: '$timestamps' }, maxRequests] },
              { $concatArrays: ['$timestamps', [now]] },
              '$timestamps',
            ],
          },
        },
      },
    ],
    { upsert: true, new: true },
  ).lean();

  return usage?.lastAcceptedToken === token;
}
