import mongoose, { Document, Schema } from 'mongoose';

export interface IAcceptanceReview extends Document {
  _id: mongoose.Types.ObjectId;
  councilId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  result: 'PASSED' | 'FAILED';
  failReason?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const AcceptanceReviewSchema = new Schema<IAcceptanceReview>(
  {
    councilId: { type: Schema.Types.ObjectId, ref: 'Council', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    result: { type: String, enum: ['PASSED', 'FAILED'], required: true },
    failReason: String,
    submittedAt: { type: Date, default: Date.now },
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

AcceptanceReviewSchema.index({ councilId: 1, reviewerId: 1 });

export const AcceptanceReview = mongoose.model<IAcceptanceReview>('AcceptanceReview', AcceptanceReviewSchema);
