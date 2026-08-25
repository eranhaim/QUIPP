import { Schema, model, type InferSchemaType } from 'mongoose';

export const DEEP_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type DeepStatus = (typeof DEEP_STATUSES)[number];

const deepSubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inCredentialId: {
      type: Schema.Types.ObjectId,
      ref: 'Credential',
      required: true,
    },
    /** The DEEP-tier course we'll issue upon approval. */
    deepCourseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    deepCourseSlug: { type: String, required: true, lowercase: true, trim: true },

    supervisorName: { type: String, required: true, trim: true, maxlength: 120 },
    supervisorEmail: { type: String, required: true, lowercase: true, trim: true },
    supervisorText: { type: String, required: true, trim: true, maxlength: 2000 },

    status: { type: String, enum: DEEP_STATUSES, default: 'pending', index: true },
    reviewNotes: { type: String, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    /** Set when approved so we don't accidentally re-issue a credential. */
    issuedCredentialId: { type: Schema.Types.ObjectId, ref: 'Credential', default: null },
  },
  { timestamps: true },
);

// One pending submission per user per DEEP course.
deepSubmissionSchema.index(
  { userId: 1, deepCourseSlug: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  },
);

export type DeepSubmissionDoc = InferSchemaType<typeof deepSubmissionSchema> & {
  _id: Schema.Types.ObjectId;
};
export const DeepSubmission = model('DeepSubmission', deepSubmissionSchema);
