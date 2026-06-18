import mongoose, { Document, Schema } from 'mongoose';
import { CYCLE_STATUS } from '../../../constants/status';

export interface ICycle extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  academicYear?: string;
  status: keyof typeof CYCLE_STATUS;
  researchTypeId?: mongoose.Types.ObjectId;
  submissionStart?: Date;
  submissionEnd?: Date;
  reviewStart?: Date;
  reviewEnd?: Date;
  progressReportDeadline?: Date;
  finalReportDeadline?: Date;
  description?: string;
  totalBudget?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const CycleSchema = new Schema<ICycle>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    status: { type: String, enum: Object.values(CYCLE_STATUS), default: CYCLE_STATUS.PLANNING },
    researchTypeId: { type: Schema.Types.ObjectId, ref: 'ResearchType' },
    submissionStart: { type: Date },
    submissionEnd: { type: Date },
    reviewStart: { type: Date },
    reviewEnd: { type: Date },
    progressReportDeadline: { type: Date },
    finalReportDeadline: { type: Date },
    description: { type: String },
    totalBudget: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const record = ret as Record<string, unknown>;
        record.id = record._id;
        delete record._id;
        delete record.__v;
        return record;
      },
    },
  },
);

CycleSchema.index({ status: 1, isDeleted: 1 });
CycleSchema.index({ academicYear: 1 });

export const Cycle = mongoose.model<ICycle>('Cycle', CycleSchema);
