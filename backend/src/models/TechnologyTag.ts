import { Schema, model, type InferSchemaType } from 'mongoose';

export const TAG_NAMES = ['THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'SERVICE'] as const;
export type TagName = (typeof TAG_NAMES)[number];

const technologyTagSchema = new Schema(
  {
    tagName: {
      type: String,
      required: true,
      unique: true,
      enum: TAG_NAMES,
      index: true,
    },
    label: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type TechnologyTagDoc = InferSchemaType<typeof technologyTagSchema> & {
  _id: Schema.Types.ObjectId;
};
export const TechnologyTag = model('TechnologyTag', technologyTagSchema);
