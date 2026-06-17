import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { Notification } from '../models/notification.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's notifications
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Notifications retrieved
 */
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

/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount: { type: integer }
 */
router.get('/count', authenticate, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user!.sub, isRead: false, isDeleted: false });
  sendSuccess(res, { unreadCount: count }, 'Unread count retrieved.');
}));

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user!.sub, isRead: false, isDeleted: false },
    { isRead: true, readAt: new Date() },
  );
  sendSuccess(res, null, 'All notifications marked as read.');
}));

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.sub, isDeleted: false },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found.');
  sendSuccess(res, notification, 'Notification marked as read.');
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
