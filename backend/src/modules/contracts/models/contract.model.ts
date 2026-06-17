import mongoose, { Document, Schema } from 'mongoose';
import { CONTRACT_STATUS, FUNDING_METHOD } from '../../../constants/status';

export interface IContract extends Document {
  _id: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  maxExtensionMonths: number;
  fundingMethod: keyof typeof FUNDING_METHOD;
  totalAmount: number;
  sideARepresentative?: string;
  econtractUrl?: string;
  status: keyof typeof CONTRACT_STATUS;
  signedAt?: Date;
  signedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
    contractNumber: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    maxExtensionMonths: { type: Number, default: 6 },
    fundingMethod: { type: String, enum: Object.values(FUNDING_METHOD), default: FUNDING_METHOD.PARTIAL },
    totalAmount: { type: Number, default: 0 },
    sideARepresentative: String,
    econtractUrl: String,
    status: { type: String, enum: Object.values(CONTRACT_STATUS), default: CONTRACT_STATUS.PENDING_SIGNATURE },
    signedAt: Date,
    signedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { const record = ret as Record<string, unknown>; record.id = record._id; delete record._id; delete record.__v; return record; },
    },
  },
);

ContractSchema.index({ proposalId: 1 });
ContractSchema.index({ status: 1, isDeleted: 1 });

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
