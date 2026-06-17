import mongoose, { Document, Schema } from 'mongoose';

export interface IScoreDetail {
  criterionId: mongoose.Types.ObjectId;
  givenScore: number;
  comments?: string;
}

export interface IReviewScore extends Document {
  _id: mongoose.Types.ObjectId;
  councilId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  generalComments?: string;
  otherRecommendations?: string;
  totalScore: number;
  scoreDetails: IScoreDetail[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const ScoreDetailSchema = new Schema<IScoreDetail>({
  criterionId: { type: Schema.Types.ObjectId, ref: 'RubricCriteria', required: true },
  givenScore: { type: Number, required: true },
  comments: String,
});

const ReviewScoreSchema = new Schema<IReviewScore>(
  {
    councilId: { type: Schema.Types.ObjectId, ref: 'Council', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'RubricCriteria' },
    generalComments: String,
    otherRecommendations: String,
    totalScore: { type: Number, default: 0 },
    scoreDetails: [ScoreDetailSchema],
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

ReviewScoreSchema.index({ councilId: 1, reviewerId: 1 });

export const ReviewScore = mongoose.model<IReviewScore>('ReviewScore', ReviewScoreSchema);
