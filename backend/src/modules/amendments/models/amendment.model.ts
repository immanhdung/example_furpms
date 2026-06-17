import mongoose, { Document, Schema } from 'mongoose';
import { AMENDMENT_STATUS } from '../../../constants/status';

export interface IAmendment extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  changeDescription: string;
  justification: string;
  changePercentage?: number;
  oldValue?: string;
  newValue?: string;
  requiresRectorApproval: boolean;
  reviewerComments?: string;
  status: keyof typeof AMENDMENT_STATUS;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const AmendmentSchema = new Schema<IAmendment>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    categoryId: { type: Schema.Types.ObjectId },
    changeDescription: { type: String, required: true },
    justification: { type: String, required: true },
    changePercentage: Number,
    oldValue: String,
    newValue: String,
    requiresRectorApproval: { type: Boolean, default: false },
    reviewerComments: String,
    status: { type: String, enum: Object.values(AMENDMENT_STATUS), default: AMENDMENT_STATUS.PENDING },
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

AmendmentSchema.index({ contractId: 1 });

export const Amendment = mongoose.model<IAmendment>('Amendment', AmendmentSchema);
