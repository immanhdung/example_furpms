import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonnelRoleType extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const PersonnelRoleTypeSchema = new Schema<IPersonnelRoleType>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: true },
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

export const PersonnelRoleType = mongoose.model<IPersonnelRoleType>('PersonnelRoleType', PersonnelRoleTypeSchema);
