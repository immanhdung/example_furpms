import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  ownerId?: mongoose.Types.ObjectId;
  maxBudget?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const TrackSchema = new Schema<ITrack>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    maxBudget: { type: Number },
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
        return record;
      },
    },
  },
);

TrackSchema.index({ isActive: 1, isDeleted: 1 });

export const Track = mongoose.model<ITrack>('Track', TrackSchema);
