import mongoose, { Document, Schema } from 'mongoose';
import { COUNCIL_MEMBER_STATUS, COUNCIL_MEMBER_ROLE } from '../../../constants/status';

export interface ICouncilMember extends Document {
  _id: mongoose.Types.ObjectId;
  councilId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  memberRole: keyof typeof COUNCIL_MEMBER_ROLE;
  isExternal: boolean;
  status: keyof typeof COUNCIL_MEMBER_STATUS;
  responseNote?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const CouncilMemberSchema = new Schema<ICouncilMember>(
  {
    councilId: { type: Schema.Types.ObjectId, ref: 'Council', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberRole: {
      type: String,
      enum: Object.values(COUNCIL_MEMBER_ROLE),
      default: COUNCIL_MEMBER_ROLE.MEMBER,
    },
    isExternal: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(COUNCIL_MEMBER_STATUS), default: COUNCIL_MEMBER_STATUS.PENDING },
    responseNote: String,
    respondedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

CouncilMemberSchema.index({ councilId: 1 });
CouncilMemberSchema.index({ userId: 1 });

export const CouncilMember = mongoose.model<ICouncilMember>('CouncilMember', CouncilMemberSchema);
