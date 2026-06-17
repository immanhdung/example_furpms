import mongoose, { Document, Schema } from 'mongoose';
import { PROGRESS_REPORT_STATUS } from '../../../constants/status';

export interface IProgressReport extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  reportingPeriod: string;
  title: string;
  content: string;
  completionPercentage: number;
  issues?: string;
  nextSteps?: string;
  status: keyof typeof PROGRESS_REPORT_STATUS;
  submittedAt?: Date;
  evaluatedAt?: Date;
  evaluatedBy?: mongoose.Types.ObjectId;
  evaluationComments?: string;
  attachmentUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const ProgressReportSchema = new Schema<IProgressReport>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    reportingPeriod: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    issues: String,
    nextSteps: String,
    status: { type: String, enum: Object.values(PROGRESS_REPORT_STATUS), default: PROGRESS_REPORT_STATUS.DRAFT },
    submittedAt: Date,
    evaluatedAt: Date,
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    evaluationComments: String,
    attachmentUrls: [{ type: String }],
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

export const ProgressReport = mongoose.model<IProgressReport>('ProgressReport', ProgressReportSchema);
