import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganizationalUnit extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  shortName?: string;
  parentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const OrganizationalUnitSchema = new Schema<IOrganizationalUnit>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    shortName: String,
    parentId: { type: Schema.Types.ObjectId, ref: 'OrganizationalUnit' },
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

export const OrganizationalUnit = mongoose.model<IOrganizationalUnit>('OrganizationalUnit', OrganizationalUnitSchema);
