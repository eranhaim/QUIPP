import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const WHATSAPP_COURSE_LEAD_STAGES = [
  'new',
  'qualifying',
  'qualified',
  'human_requested',
  'closed',
] as const;

const whatsAppCourseLeadSchema = new Schema(
  {
    chatId: { type: String, required: true, unique: true, trim: true, index: true },
    phone: { type: String, default: null, trim: true, index: true },
    senderName: { type: String, default: null, trim: true, maxlength: 200 },
    stage: {
      type: String,
      enum: WHATSAPP_COURSE_LEAD_STAGES,
      default: 'new',
      index: true,
    },
    qualificationStep: {
      type: String,
      enum: ['goal', 'experience', 'name', 'email', 'complete'],
      default: 'goal',
    },
    courseSlug: { type: String, default: null, trim: true, index: true },
    learningGoal: { type: String, default: null, trim: true, maxlength: 500 },
    experience: { type: String, default: null, trim: true, maxlength: 500 },
    contactName: { type: String, default: null, trim: true, maxlength: 200 },
    email: { type: String, default: null, trim: true, lowercase: true, maxlength: 320 },
    escalationRequestedAt: { type: Date, default: null },
    lastInboundAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export type WhatsAppCourseLeadDoc = InferSchemaType<typeof whatsAppCourseLeadSchema> & {
  _id: Types.ObjectId;
};

export const WhatsAppCourseLead = model('WhatsAppCourseLead', whatsAppCourseLeadSchema);
