import mongoose, { Document, Schema } from 'mongoose';

export interface IResearchOrder extends Document {
  _id: mongoose.Types.ObjectId;
  cycleId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requiredBy?: string;
  budget?: number;
  matchedProposalId?: mongoose.Types.ObjectId;
  status: 'OPEN' | 'MATCHED' | 'CLOSED';
  requestedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const ResearchOrderSchema = new Schema<IResearchOrder>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'Cycle' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredBy: String,
    budget: Number,
    matchedProposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    status: { type: String, enum: ['OPEN', 'MATCHED', 'CLOSED'], default: 'OPEN' },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

export const ResearchOrder = mongoose.model<IResearchOrder>('ResearchOrder', ResearchOrderSchema);
