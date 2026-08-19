import { Schema, model, type InferSchemaType } from 'mongoose';
import { TAG_NAMES } from './TechnologyTag.js';

const declSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    equipmentName: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, default: null, trim: true, maxlength: 80 },
    tagName: { type: String, enum: TAG_NAMES, default: null },
    verified: { type: Boolean, default: false },
    declaredAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

declSchema.index({ userId: 1, equipmentName: 1 }, { unique: true });

export type WorkerTechDeclarationDoc = InferSchemaType<typeof declSchema> & {
  _id: Schema.Types.ObjectId;
};
export const WorkerTechDeclaration = model('WorkerTechDeclaration', declSchema);
