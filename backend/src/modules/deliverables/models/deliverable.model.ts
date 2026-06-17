import mongoose, { Document, Schema } from 'mongoose';
import { DELIVERABLE_STATUS } from '../../../constants/status';

export interface IDeliverable extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  dueDate: Date;
  fileUrl?: string;
  submittedAt?: Date;
  submittedBy?: mongoose.Types.ObjectId;
  acceptanceStatus: keyof typeof DELIVERABLE_STATUS;
  qualityAssessment?: string;
  evaluatedAt?: Date;
  evaluatedBy?: mongoose.Types.ObjectId;
  isCompleted: boolean;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const DeliverableSchema = new Schema<IDeliverable>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    name: { type: String, required: true },
    description: String,
    dueDate: { type: Date, required: true },
    fileUrl: String,
    submittedAt: Date,
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptanceStatus: {
      type: String,
      enum: Object.values(DELIVERABLE_STATUS),
      default: DELIVERABLE_STATUS.PENDING,
    },
    qualityAssessment: String,
    evaluatedAt: Date,
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isCompleted: { type: Boolean, default: false },
    sequence: { type: Number, default: 0 },
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

DeliverableSchema.index({ contractId: 1 });
DeliverableSchema.index({ dueDate: 1 });

export const Deliverable = mongoose.model<IDeliverable>('Deliverable', DeliverableSchema);
