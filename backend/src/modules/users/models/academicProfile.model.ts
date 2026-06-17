import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  researchAreas?: string[];
  publications?: string[];
  awards?: string[];
  projects?: string[];
  bio?: string;
  orcidId?: string;
  googleScholarUrl?: string;
  researchGateUrl?: string;
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const AcademicProfileSchema = new Schema<IAcademicProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    researchAreas: [{ type: String }],
    publications: [{ type: String }],
    awards: [{ type: String }],
    projects: [{ type: String }],
    bio: { type: String },
    orcidId: { type: String },
    googleScholarUrl: { type: String },
    researchGateUrl: { type: String },
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

AcademicProfileSchema.index({ userId: 1 });

export const AcademicProfile = mongoose.model<IAcademicProfile>(
  'AcademicProfile',
  AcademicProfileSchema,
);
