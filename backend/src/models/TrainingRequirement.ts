import { Schema, model, type InferSchemaType } from 'mongoose';
import { BASE_ROLES } from './Profile.js';

const trainingRequirementSchema = new Schema(
  {
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'OperatorLocation',
      default: null,
      index: true,
    },
    baseRole: { type: String, enum: [...BASE_ROLES, null], default: null },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    required: { type: Boolean, default: true },
  },
  { timestamps: true },
);

trainingRequirementSchema.index(
  { operatorId: 1, locationId: 1, baseRole: 1, courseId: 1 },
  { unique: true },
);

export type TrainingRequirementDoc = InferSchemaType<typeof trainingRequirementSchema> & {
  _id: Schema.Types.ObjectId;
};
export const TrainingRequirement = model(
  'TrainingRequirement',
  trainingRequirementSchema,
);
