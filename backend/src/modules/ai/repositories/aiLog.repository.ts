import { AiLog, IAiLog, AiFeature } from '../models/aiLog.model';
import mongoose from 'mongoose';

export const aiLogRepository = {
  async create(data: Partial<IAiLog>): Promise<IAiLog> {
    return AiLog.create(data);
  },

  async findAll(filter: {
    feature?: AiFeature;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const query: Record<string, unknown> = {};
    if (filter.feature) query.feature = filter.feature;
    if (filter.userId) query.userId = new mongoose.Types.ObjectId(filter.userId);

    const skip = (filter.page - 1) * filter.limit;
    const [items, total] = await Promise.all([
      AiLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit)
        .populate('userId', 'fullName email')
        .lean(),
      AiLog.countDocuments(query),
    ]);

    return {
      items,
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  },

  async getAnalytics(days: number) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [totalRequests, byFeature, byDay, tokenStats, cacheStats] = await Promise.all([
      AiLog.countDocuments({ createdAt: { $gte: since } }),

      AiLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$feature',
            count: { $sum: 1 },
            tokens: { $sum: '$tokensTotal' },
            avgDuration: { $avg: '$durationMs' },
            errors: { $sum: { $cond: [{ $ifNull: ['$error', false] }, 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),

      AiLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            requests: { $sum: 1 },
            tokens: { $sum: '$tokensTotal' },
            cached: { $sum: { $cond: ['$cached', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      AiLog.aggregate([
        { $match: { createdAt: { $gte: since }, cached: false } },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$tokensTotal' },
            totalInput: { $sum: '$tokensInput' },
            totalOutput: { $sum: '$tokensOutput' },
            avgTokens: { $avg: '$tokensTotal' },
            avgDurationMs: { $avg: '$durationMs' },
            maxDurationMs: { $max: '$durationMs' },
          },
        },
      ]),

      AiLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            cached: { $sum: { $cond: ['$cached', 1, 0] } },
          },
        },
      ]),
    ]);

    const ts = tokenStats[0] ?? {
      totalTokens: 0,
      totalInput: 0,
      totalOutput: 0,
      avgTokens: 0,
      avgDurationMs: 0,
      maxDurationMs: 0,
    };
    const cs = cacheStats[0] ?? { total: 0, cached: 0 };

    return {
      period: { days, since },
      totalRequests,
      byFeature,
      byDay,
      tokenStats: ts,
      cacheStats: {
        ...cs,
        hitRate: cs.total > 0 ? Number((cs.cached / cs.total).toFixed(3)) : 0,
      },
    };
  },
};
