import mongoose, { Document, Schema } from 'mongoose';

export type AiFeature =
  | 'PROPOSAL_SUMMARY'
  | 'FINAL_REPORT_SUMMARY'
  | 'REVIEWER_SUGGESTION'
  | 'RECOMMENDATION'
  | 'SEMANTIC_SEARCH';

export interface IAiLog extends Document {
  _id: mongoose.Types.ObjectId;
  feature: AiFeature;
  entityId?: mongoose.Types.ObjectId;
  entityType?: string;
  userId: mongoose.Types.ObjectId;
  prompt: string;
  response: string;
  aiModel: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  durationMs: number;
  cached: boolean;
  error?: string;
  createdAt: Date;
}

const AiLogSchema = new Schema<IAiLog>(
  {
    feature: {
      type: String,
      enum: ['PROPOSAL_SUMMARY', 'FINAL_REPORT_SUMMARY', 'REVIEWER_SUGGESTION', 'RECOMMENDATION', 'SEMANTIC_SEARCH'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    prompt: { type: String, required: true, maxlength: 8000 },
    response: { type: String, default: '', maxlength: 16000 },
    aiModel: { type: String, required: true },
    tokensInput: { type: Number, default: 0 },
    tokensOutput: { type: Number, default: 0 },
    tokensTotal: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    cached: { type: Boolean, default: false },
    error: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AiLogSchema.index({ feature: 1, createdAt: -1 });
AiLogSchema.index({ userId: 1, createdAt: -1 });
AiLogSchema.index({ entityId: 1, feature: 1 });
AiLogSchema.index({ createdAt: -1 });

export const AiLog = mongoose.model<IAiLog>('AiLog', AiLogSchema);
