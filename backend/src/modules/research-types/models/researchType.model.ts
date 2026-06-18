import mongoose, { Document, Schema } from 'mongoose';
import { RESEARCH_TYPE_CODE } from '../../../constants/status';

export interface IResearchType extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: keyof typeof RESEARCH_TYPE_CODE | string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const ResearchTypeSchema = new Schema<IResearchType>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
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

ResearchTypeSchema.index({ code: 1, isDeleted: 1 }, { unique: true, sparse: true });

export const ResearchType = mongoose.model<IResearchType>('ResearchType', ResearchTypeSchema);
