import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { FinalReport } from '../models/finalReport.model';
import { Contract } from '../../contracts/models/contract.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

const CreateSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(10),
  achievements: z.string().min(10),
  challenges: z.string().optional(),
  recommendations: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional().default([]),
});

router.get('/:contractId', authenticate, asyncHandler(async (req, res) => {
  const report = await FinalReport.findOne({ contractId: req.params.contractId, isDeleted: false });
  sendSuccess(res, report, 'Final report retrieved.');
}));

router.post('/:contractId/submit', authenticate, asyncHandler(async (req, res) => {
  const dto = CreateSchema.parse(req.body);
  const existing = await FinalReport.findOne({ contractId: req.params.contractId, isDeleted: false });

  let report;
  if (existing) {
    report = await FinalReport.findByIdAndUpdate(
      existing._id,
      { ...dto, status: 'SUBMITTED', submittedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
      { new: true },
    );
  } else {
    report = await new FinalReport({
      ...dto,
      contractId: new mongoose.Types.ObjectId(req.params.contractId),
      status: 'SUBMITTED',
      submittedAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(req.user!.sub),
    }).save();
  }
  sendSuccess(res, report, 'Final report submitted.');
}));

router.post('/:id/request-revision', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { revisionNotes } = z.object({ revisionNotes: z.string().optional() }).parse(req.body);
  const report = await FinalReport.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'REVISION_REQUIRED', revisionNotes, revisionRequestedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!report) throw ApiError.notFound('Final report not found.');
  sendSuccess(res, report, 'Revision requested.');
}));

router.post('/:id/accept', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const report = await FinalReport.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ACCEPTED', acceptedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!report) throw ApiError.notFound('Final report not found.');
  await Contract.findByIdAndUpdate(report.contractId, { status: 'COMPLETED' });
  sendSuccess(res, report, 'Final report accepted.');
}));

router.post('/:id/archive', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const report = await FinalReport.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ARCHIVED', archivedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!report) throw ApiError.notFound('Final report not found.');
  sendSuccess(res, report, 'Final report archived.');
}));

export default router;
