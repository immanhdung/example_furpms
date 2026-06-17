import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { Disbursement } from '../models/disbursement.model';
import { Deliverable } from '../../deliverables/models/deliverable.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

router.post('/:id/confirm', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    actualAmount: z.number().positive(),
    bankReference: z.string().min(1),
    notes: z.string().optional(),
  });
  const dto = schema.parse(req.body);

  const disbursement = await Disbursement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      ...dto,
      status: 'DISBURSED',
      disbursedAt: new Date(),
      confirmedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!disbursement) throw ApiError.notFound('Disbursement not found.');
  sendSuccess(res, disbursement, 'Disbursement confirmed.');
}));

export default router;
