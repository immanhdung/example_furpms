import mongoose, { Document, Schema } from 'mongoose';
import { ROUND_TYPE } from '../../../constants/status';

export interface IRubricCriteria extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  roundType: keyof typeof ROUND_TYPE;
  maxScore: number;
  weight: number;
  sequence: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const RubricCriteriaSchema = new Schema<IRubricCriteria>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: String,
    roundType: { type: String, enum: Object.values(ROUND_TYPE), required: true },
    maxScore: { type: Number, required: true, default: 10 },
    weight: { type: Number, required: true, default: 1 },
    sequence: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
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

export const RubricCriteria = mongoose.model<IRubricCriteria>('RubricCriteria', RubricCriteriaSchema);
