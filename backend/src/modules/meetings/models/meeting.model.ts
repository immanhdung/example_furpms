import mongoose, { Document, Schema } from 'mongoose';
import { MEETING_PLATFORM, MEETING_STATUS } from '../../../constants/status';

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId;
  councilId: mongoose.Types.ObjectId;
  title?: string;
  platform: keyof typeof MEETING_PLATFORM;
  meetingLink?: string;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  durationMinutes: number;
  agenda?: string;
  status: keyof typeof MEETING_STATUS;
  minutesUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    councilId: { type: Schema.Types.ObjectId, ref: 'Council', required: true },
    title: String,
    platform: { type: String, enum: Object.values(MEETING_PLATFORM), default: MEETING_PLATFORM.IN_PERSON },
    meetingLink: String,
    scheduledAt: { type: Date, required: true },
    startedAt: Date,
    endedAt: Date,
    durationMinutes: { type: Number, default: 120 },
    agenda: String,
    status: { type: String, enum: Object.values(MEETING_STATUS), default: MEETING_STATUS.SCHEDULED },
    minutesUrl: String,
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

MeetingSchema.index({ councilId: 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);
