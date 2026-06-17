import { AiCache } from '../models/aiCache.model';

const CACHE_TTL_HOURS = 24;

export const aiCacheRepository = {
  async get(cacheKey: string): Promise<string | null> {
    const cached = await AiCache.findOne({
      cacheKey,
      expiresAt: { $gt: new Date() },
    }).lean();
    return cached ? cached.response : null;
  },

  async set(
    cacheKey: string,
    feature: string,
    response: string,
    tokensTotal = 0,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000);
    await AiCache.findOneAndUpdate(
      { cacheKey },
      { cacheKey, feature, response, tokensTotal, expiresAt },
      { upsert: true, new: true },
    );
  },

  async invalidate(cacheKey: string): Promise<void> {
    await AiCache.deleteOne({ cacheKey });
  },

  async invalidateByFeature(feature: string): Promise<void> {
    await AiCache.deleteMany({ feature });
  },

  async getStats() {
    const total = await AiCache.countDocuments();
    const expired = await AiCache.countDocuments({ expiresAt: { $lte: new Date() } });
    return { total, active: total - expired, expired };
  },
};
