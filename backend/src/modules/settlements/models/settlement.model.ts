import mongoose, { Document, Schema } from 'mongoose';
import { SETTLEMENT_STATUS } from '../../../constants/status';

export interface ISettlement extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  totalDisbursed: number;
  totalExpense: number;
  surplus: number;
  notes?: string;
  status: keyof typeof SETTLEMENT_STATUS;
  signedAt?: Date;
  signedBy?: mongoose.Types.ObjectId;
  accountingClearedAt?: Date;
  assetsClearedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    totalDisbursed: { type: Number, required: true },
    totalExpense: { type: Number, required: true },
    surplus: { type: Number, required: true },
    notes: String,
    status: { type: String, enum: Object.values(SETTLEMENT_STATUS), default: SETTLEMENT_STATUS.DRAFT },
    signedAt: Date,
    signedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    accountingClearedAt: Date,
    assetsClearedAt: Date,
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

export const Settlement = mongoose.model<ISettlement>('Settlement', SettlementSchema);
