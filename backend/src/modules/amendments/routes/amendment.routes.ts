import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { Amendment } from '../models/amendment.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const amendment = await Amendment.findOne({ _id: req.params.id, isDeleted: false })
    .populate('contractId', 'contractNumber status')
    .populate('reviewedBy', 'fullName email');
  if (!amendment) throw ApiError.notFound('Amendment not found.');
  sendSuccess(res, amendment, 'Amendment retrieved.');
}));

router.post('/:id/approve', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({ reviewerComments: z.string().optional() });
  const { reviewerComments } = schema.parse(req.body);

  const amendment = await Amendment.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      status: 'APPROVED',
      reviewerComments,
      reviewedAt: new Date(),
      reviewedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!amendment) throw ApiError.notFound('Amendment not found.');
  sendSuccess(res, amendment, 'Amendment approved.');
}));

router.post('/:id/reject', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({ reviewerComments: z.string().optional() });
  const { reviewerComments } = schema.parse(req.body);

  const amendment = await Amendment.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      status: 'REJECTED',
      reviewerComments,
      reviewedAt: new Date(),
      reviewedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!amendment) throw ApiError.notFound('Amendment not found.');
  sendSuccess(res, amendment, 'Amendment rejected.');
}));

export default router;
