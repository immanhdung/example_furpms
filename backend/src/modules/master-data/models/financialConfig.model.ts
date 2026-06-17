import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialConfig extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: number;
  unit: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const FinancialConfigSchema = new Schema<IFinancialConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    unit: { type: String, default: 'VND' },
    description: String,
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

export const FinancialConfig = mongoose.model<IFinancialConfig>('FinancialConfig', FinancialConfigSchema);
