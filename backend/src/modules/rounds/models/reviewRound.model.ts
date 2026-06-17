import mongoose, { Document, Schema } from 'mongoose';
import { ROUND_TYPE, ROUND_STATUS, ROUND_DIMENSION } from '../../../constants/status';

export interface IReviewRound extends Document {
  _id: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  councilId?: mongoose.Types.ObjectId;
  roundNumber: number;
  dimension: keyof typeof ROUND_DIMENSION;
  roundType: keyof typeof ROUND_TYPE;
  rubricTemplateId?: mongoose.Types.ObjectId;
  sequence: number;
  prerequisiteRoundId?: mongoose.Types.ObjectId;
  status: keyof typeof ROUND_STATUS;
  openedAt?: Date;
  closedAt?: Date;
  result?: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
  assignedReviewers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const ReviewRoundSchema = new Schema<IReviewRound>(
  {
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
    councilId: { type: Schema.Types.ObjectId, ref: 'Council' },
    roundNumber: { type: Number, required: true },
    dimension: { type: String, enum: Object.values(ROUND_DIMENSION), default: ROUND_DIMENSION.SCIENCE },
    roundType: { type: String, enum: Object.values(ROUND_TYPE), required: true },
    rubricTemplateId: { type: Schema.Types.ObjectId, ref: 'RubricCriteria' },
    sequence: { type: Number, default: 0 },
    prerequisiteRoundId: { type: Schema.Types.ObjectId, ref: 'ReviewRound' },
    status: { type: String, enum: Object.values(ROUND_STATUS), default: ROUND_STATUS.PENDING },
    openedAt: Date,
    closedAt: Date,
    result: { type: String, enum: ['APPROVED', 'REJECTED', 'REVISION_REQUIRED'] },
    assignedReviewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

ReviewRoundSchema.index({ proposalId: 1, isDeleted: 1 });
ReviewRoundSchema.index({ status: 1 });

export const ReviewRound = mongoose.model<IReviewRound>('ReviewRound', ReviewRoundSchema);
