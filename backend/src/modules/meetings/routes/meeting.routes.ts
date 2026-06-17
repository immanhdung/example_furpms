import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { Meeting } from '../models/meeting.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Council meeting management
 */

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: List all meetings (Admin/Staff only)
 *     tags: [Meetings]
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
 *         description: Meetings retrieved
 */
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPaginationOptions(req);
  const [items, total] = await Promise.all([
    Meeting.find({ isDeleted: false })
      .populate('councilId', 'proposalId councilType')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit),
    Meeting.countDocuments({ isDeleted: false }),
  ]);
  res.json({ success: true, message: 'Meetings retrieved.', data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, errors: null });
}));

/**
 * @swagger
 * /api/meetings/{id}/start:
 *   post:
 *     summary: Start a meeting
 *     tags: [Meetings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Meeting started
 */
router.post('/:id/start', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ONGOING', startedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!meeting) throw ApiError.notFound('Meeting not found.');
  sendSuccess(res, meeting, 'Meeting started.');
}));

/**
 * @swagger
 * /api/meetings/{id}/end:
 *   post:
 *     summary: End a meeting
 *     tags: [Meetings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minutesUrl: { type: string, description: URL to meeting minutes document }
 *     responses:
 *       200:
 *         description: Meeting ended
 */
router.post('/:id/end', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { minutesUrl } = req.body;
  const meeting = await Meeting.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      status: 'COMPLETED',
      endedAt: new Date(),
      minutesUrl,
      updatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!meeting) throw ApiError.notFound('Meeting not found.');
  sendSuccess(res, meeting, 'Meeting ended.');
}));

export default router;
