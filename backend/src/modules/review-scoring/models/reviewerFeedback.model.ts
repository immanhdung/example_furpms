import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewerFeedback extends Document {
  _id: mongoose.Types.ObjectId;
  councilId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  urgencyScore?: number;
  scientificContributionScore?: number;
  practicalSignificanceScore?: number;
  actualVsExpectedScore?: number;
  overallAssessment?: string;
  otherComments?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const ReviewerFeedbackSchema = new Schema<IReviewerFeedback>(
  {
    councilId: { type: Schema.Types.ObjectId, ref: 'Council', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    urgencyScore: { type: Number, min: 1, max: 5 },
    scientificContributionScore: { type: Number, min: 1, max: 5 },
    practicalSignificanceScore: { type: Number, min: 1, max: 5 },
    actualVsExpectedScore: { type: Number, min: 1, max: 5 },
    overallAssessment: String,
    otherComments: String,
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

ReviewerFeedbackSchema.index({ councilId: 1, reviewerId: 1 });

export const ReviewerFeedback = mongoose.model<IReviewerFeedback>('ReviewerFeedback', ReviewerFeedbackSchema);
