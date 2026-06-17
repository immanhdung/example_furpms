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

// GET /api/meetings — all meetings (Admin, Staff)
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

// POST /api/meetings/:id/start
router.post('/:id/start', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ONGOING', startedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!meeting) throw ApiError.notFound('Meeting not found.');
  sendSuccess(res, meeting, 'Meeting started.');
}));

// POST /api/meetings/:id/end
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
