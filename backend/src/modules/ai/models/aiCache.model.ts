import mongoose, { Document, Schema } from 'mongoose';

export interface IAiCache extends Document {
  _id: mongoose.Types.ObjectId;
  cacheKey: string;
  feature: string;
  response: string;
  tokensTotal: number;
  expiresAt: Date;
  createdAt: Date;
}

const AiCacheSchema = new Schema<IAiCache>(
  {
    cacheKey: { type: String, required: true, unique: true },
    feature: { type: String, required: true },
    response: { type: String, required: true, maxlength: 16000 },
    tokensTotal: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AiCache = mongoose.model<IAiCache>('AiCache', AiCacheSchema);
