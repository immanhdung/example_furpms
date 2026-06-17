import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '../../../constants/roles';
import { USER_STATUS } from '../../../constants/status';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string;
  department?: string;
  academicDegree?: number;
  roles: Role[];
  status: keyof typeof USER_STATUS;
  lastLoginAt?: Date;
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
  // Methods
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true },
    department: { type: String, trim: true },
    academicDegree: { type: Number },
    roles: {
      type: [String],
      enum: ['Admin', 'Staff', 'Faculty', 'ReviewCommittee'],
      default: ['Faculty'],
    },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
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
        delete record.passwordHash;
        return record;
      },
    },
  },
);

UserSchema.index({ email: 1 });
UserSchema.index({ isDeleted: 1, status: 1 });
UserSchema.index({ roles: 1 });

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
