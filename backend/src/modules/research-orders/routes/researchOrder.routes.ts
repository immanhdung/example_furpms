import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { ResearchOrder } from '../models/researchOrder.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

const CreateSchema = z.object({
  cycleId: z.string().optional(),
  title: z.string().min(5),
  description: z.string().min(10),
  requiredBy: z.string().optional(),
  budget: z.number().positive().optional(),
});

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPaginationOptions(req);
  const filter: Record<string, unknown> = { isDeleted: false };
  if (req.query.cycleId) filter.cycleId = req.query.cycleId;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    ResearchOrder.find(filter)
      .populate('cycleId', 'name year')
      .populate('matchedProposalId', 'titleVI titleEN status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ResearchOrder.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Research orders retrieved.', data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, errors: null });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await ResearchOrder.findOne({ _id: req.params.id, isDeleted: false })
    .populate('cycleId', 'name year')
    .populate('matchedProposalId', 'titleVI titleEN status');
  if (!order) throw ApiError.notFound('Research order not found.');
  sendSuccess(res, order, 'Research order retrieved.');
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const dto = CreateSchema.parse(req.body);
  const order = await new ResearchOrder({
    ...dto,
    cycleId: dto.cycleId ? new mongoose.Types.ObjectId(dto.cycleId) : undefined,
    requestedBy: new mongoose.Types.ObjectId(req.user!.sub),
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, order, 'Research order created.');
}));

router.post('/:id/match', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { proposalId } = z.object({ proposalId: z.string() }).parse(req.body);
  const order = await ResearchOrder.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      matchedProposalId: new mongoose.Types.ObjectId(proposalId),
      status: 'MATCHED',
      updatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!order) throw ApiError.notFound('Research order not found.');
  sendSuccess(res, order, 'Research order matched with proposal.');
}));

export default router;
