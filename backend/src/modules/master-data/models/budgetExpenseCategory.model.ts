import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetExpenseCategory extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  sequence: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const BudgetExpenseCategorySchema = new Schema<IBudgetExpenseCategory>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    sequence: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
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

export const BudgetExpenseCategory = mongoose.model<IBudgetExpenseCategory>(
  'BudgetExpenseCategory',
  BudgetExpenseCategorySchema,
);
