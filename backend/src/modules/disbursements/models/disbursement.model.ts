import mongoose, { Document, Schema } from 'mongoose';
import { DISBURSEMENT_STATUS } from '../../../constants/status';

export interface IDisbursement extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  installmentNumber: number;
  plannedAmount: number;
  actualAmount?: number;
  plannedDate: Date;
  disbursedAt?: Date;
  bankReference?: string;
  notes?: string;
  deliverableId?: mongoose.Types.ObjectId;
  status: keyof typeof DISBURSEMENT_STATUS;
  confirmedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const DisbursementSchema = new Schema<IDisbursement>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    installmentNumber: { type: Number, required: true },
    plannedAmount: { type: Number, required: true },
    actualAmount: Number,
    plannedDate: { type: Date, required: true },
    disbursedAt: Date,
    bankReference: String,
    notes: String,
    deliverableId: { type: Schema.Types.ObjectId, ref: 'Deliverable' },
    status: { type: String, enum: Object.values(DISBURSEMENT_STATUS), default: DISBURSEMENT_STATUS.PENDING },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

DisbursementSchema.index({ contractId: 1 });

export const Disbursement = mongoose.model<IDisbursement>('Disbursement', DisbursementSchema);
