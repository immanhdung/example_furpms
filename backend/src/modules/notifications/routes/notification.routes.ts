import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { Notification } from '../models/notification.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPaginationOptions(req);
  const [items, total] = await Promise.all([
    Notification.find({ userId: req.user!.sub, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user!.sub, isDeleted: false }),
  ]);
  res.json({ success: true, message: 'Notifications retrieved.', data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, errors: null });
}));

router.get('/count', authenticate, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user!.sub, isRead: false, isDeleted: false });
  sendSuccess(res, { unreadCount: count }, 'Unread count retrieved.');
}));

router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub, isDeleted: false },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found.');
  sendSuccess(res, notification, 'Notification marked as read.');
}));

router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user!.sub, isRead: false, isDeleted: false },
    { isRead: true, readAt: new Date() },
  );
  sendSuccess(res, null, 'All notifications marked as read.');
}));

export const createNotification = async (data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}): Promise<void> => {
  await new Notification({
    userId: new mongoose.Types.ObjectId(data.userId),
    type: data.type,
    title: data.title,
    message: data.message,
    referenceId: data.referenceId ? new mongoose.Types.ObjectId(data.referenceId) : undefined,
    referenceType: data.referenceType,
  }).save();
};

export default router;
