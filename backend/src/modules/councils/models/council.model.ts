import mongoose, { Document, Schema } from 'mongoose';
import { COUNCIL_STAGE } from '../../../constants/status';

export interface ICouncil extends Document {
  _id: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  roundId?: mongoose.Types.ObjectId;
  councilType: string;
  councilStage: keyof typeof COUNCIL_STAGE;
  meetLink?: string;
  establishmentDecisionNo?: string;
  establishedAt?: Date;
  meetingDeadline?: Date;
  minMembersRequired: number;
  maxMembersAllowed: number;
  status: 'FORMING' | 'ACTIVE' | 'COMPLETED' | 'DISSOLVED';
  isResultConfirmed: boolean;
  resultConfirmedAt?: Date;
  resultConfirmedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const CouncilSchema = new Schema<ICouncil>(
  {
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
    roundId: { type: Schema.Types.ObjectId, ref: 'ReviewRound' },
    councilType: { type: String, required: true },
    councilStage: {
      type: String,
      enum: Object.values(COUNCIL_STAGE),
      default: COUNCIL_STAGE.PROPOSAL,
    },
    meetLink: { type: String },
    establishmentDecisionNo: String,
    establishedAt: Date,
    meetingDeadline: Date,
    minMembersRequired: { type: Number, default: 3 },
    maxMembersAllowed: { type: Number, default: 5 },
    status: { type: String, enum: ['FORMING', 'ACTIVE', 'COMPLETED', 'DISSOLVED'], default: 'FORMING' },
    isResultConfirmed: { type: Boolean, default: false },
    resultConfirmedAt: Date,
    resultConfirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
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

CouncilSchema.index({ proposalId: 1 });
CouncilSchema.index({ roundId: 1 });

export const Council = mongoose.model<ICouncil>('Council', CouncilSchema);
