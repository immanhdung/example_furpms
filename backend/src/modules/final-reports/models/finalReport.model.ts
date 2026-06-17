import mongoose, { Document, Schema } from 'mongoose';
import { FINAL_REPORT_STATUS } from '../../../constants/status';

export interface IFinalReport extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  achievements: string;
  challenges?: string;
  recommendations?: string;
  status: keyof typeof FINAL_REPORT_STATUS;
  submittedAt?: Date;
  acceptedAt?: Date;
  archivedAt?: Date;
  revisionRequestedAt?: Date;
  revisionNotes?: string;
  attachmentUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const FinalReportSchema = new Schema<IFinalReport>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    achievements: { type: String, required: true },
    challenges: String,
    recommendations: String,
    status: { type: String, enum: Object.values(FINAL_REPORT_STATUS), default: FINAL_REPORT_STATUS.DRAFT },
    submittedAt: Date,
    acceptedAt: Date,
    archivedAt: Date,
    revisionRequestedAt: Date,
    revisionNotes: String,
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

export const FinalReport = mongoose.model<IFinalReport>('FinalReport', FinalReportSchema);
