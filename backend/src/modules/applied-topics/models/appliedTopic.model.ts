import mongoose, { Document, Schema } from 'mongoose';
import { APPLIED_TOPIC_STATUS } from '../../../constants/status';

export interface IAppliedTopic extends Document {
  _id: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  title: string;
  topicType?: string;
  description?: string;
  orderingOrganization?: string;
  maxSelections: number;
  currentSelections: number;
  status: keyof typeof APPLIED_TOPIC_STATUS;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const AppliedTopicSchema = new Schema<IAppliedTopic>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
    title: { type: String, required: true, trim: true },
    topicType: { type: String, trim: true },
    description: { type: String },
    orderingOrganization: { type: String },
    maxSelections: { type: Number, default: 1, min: 1 },
    currentSelections: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(APPLIED_TOPIC_STATUS), default: APPLIED_TOPIC_STATUS.OPEN },
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

AppliedTopicSchema.index({ cycleId: 1, isDeleted: 1 });
AppliedTopicSchema.index({ status: 1, isDeleted: 1 });

export const AppliedTopic = mongoose.model<IAppliedTopic>('AppliedTopic', AppliedTopicSchema);
