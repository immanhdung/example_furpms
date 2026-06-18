import mongoose, { Document, Schema } from 'mongoose';

export interface IAppliedTopic extends Document {
  _id: mongoose.Types.ObjectId;
  researchTypeId: mongoose.Types.ObjectId;
  title: string;
  orderingUnit?: string;
  area?: string;
  objectives?: string;
  requirements?: string;
  expectedOutput?: string;
  applyingUnit?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const AppliedTopicSchema = new Schema<IAppliedTopic>(
  {
    researchTypeId: { type: Schema.Types.ObjectId, ref: 'ResearchType', required: true },
    title: { type: String, required: true, trim: true },
    orderingUnit: { type: String, trim: true },
    area: { type: String, trim: true },
    objectives: { type: String },
    requirements: { type: String },
    expectedOutput: { type: String },
    applyingUnit: { type: String },
    notes: { type: String },
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

AppliedTopicSchema.index({ researchTypeId: 1, isDeleted: 1 });

export const AppliedTopic = mongoose.model<IAppliedTopic>('AppliedTopic', AppliedTopicSchema);
