import mongoose, { Document, Schema } from 'mongoose';
import { NOTIFICATION_TYPE } from '../../../constants/status';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: keyof typeof NOTIFICATION_TYPE;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    referenceId: { type: Schema.Types.ObjectId },
    referenceType: String,
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

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
