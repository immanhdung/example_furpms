import mongoose, { Document, Schema } from 'mongoose';
import { DECISION_RESULT } from '../../../constants/status';

export interface ICouncilDecision extends Document {
  _id: mongoose.Types.ObjectId;
  councilId: mongoose.Types.ObjectId;
  result: keyof typeof DECISION_RESULT;
  councilComments?: string;
  recommendations?: string;
  chairUserId?: mongoose.Types.ObjectId;
  secretaryUserId?: mongoose.Types.ObjectId;
  averageScore?: number;
  decidedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouncilDecisionSchema = new Schema<ICouncilDecision>(
  {
    councilId: { type: Schema.Types.ObjectId, ref: 'Council', required: true, unique: true },
    result: { type: String, enum: Object.values(DECISION_RESULT), required: true },
    councilComments: String,
    recommendations: String,
    chairUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    secretaryUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    averageScore: Number,
    decidedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { const record = ret as Record<string, unknown>; record.id = record._id; delete record._id; delete record.__v; return record; },
    },
  },
);

export const CouncilDecision = mongoose.model<ICouncilDecision>('CouncilDecision', CouncilDecisionSchema);
