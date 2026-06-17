import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { ProgressReport } from '../models/progressReport.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

const CreateSchema = z.object({
  contractId: z.string(),
  reportingPeriod: z.string().min(1),
  title: z.string().min(5),
  content: z.string().min(10),
  completionPercentage: z.number().min(0).max(100).default(0),
  issues: z.string().optional(),
  nextSteps: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional().default([]),
});

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPaginationOptions(req);
  const filter: Record<string, unknown> = { isDeleted: false };
  if (req.query.contractId) filter.contractId = req.query.contractId;

  const [items, total] = await Promise.all([
    ProgressReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ProgressReport.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Progress reports retrieved.', data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, errors: null });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const report = await ProgressReport.findOne({ _id: req.params.id, isDeleted: false });
  if (!report) throw ApiError.notFound('Progress report not found.');
  sendSuccess(res, report, 'Progress report retrieved.');
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const dto = CreateSchema.parse(req.body);
  const report = await new ProgressReport({
    ...dto,
    contractId: new mongoose.Types.ObjectId(dto.contractId),
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, report, 'Progress report created.');
}));

router.post('/:id/submit', authenticate, asyncHandler(async (req, res) => {
  const report = await ProgressReport.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'SUBMITTED', submittedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!report) throw ApiError.notFound('Progress report not found.');
  sendSuccess(res, report, 'Progress report submitted.');
}));

router.post('/:id/evaluate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.enum(['APPROVED', 'REVISION_REQUIRED']),
    evaluationComments: z.string().optional(),
  });
  const dto = schema.parse(req.body);
  const report = await ProgressReport.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      status: dto.status,
      evaluationComments: dto.evaluationComments,
      evaluatedAt: new Date(),
      evaluatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!report) throw ApiError.notFound('Progress report not found.');
  sendSuccess(res, report, 'Progress report evaluated.');
}));

export default router;
