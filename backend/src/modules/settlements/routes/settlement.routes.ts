import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { Settlement } from '../models/settlement.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

router.post('/:id/sign', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'SIGNED', signedAt: new Date(), signedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!settlement) throw ApiError.notFound('Settlement not found.');
  sendSuccess(res, settlement, 'Settlement signed.');
}));

router.post('/:id/accounting-cleared', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ACCOUNTING_CLEARED', accountingClearedAt: new Date() },
    { new: true },
  );
  if (!settlement) throw ApiError.notFound('Settlement not found.');
  sendSuccess(res, settlement, 'Accounting cleared.');
}));

router.post('/:id/assets-cleared', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ASSETS_CLEARED', assetsClearedAt: new Date() },
    { new: true },
  );
  if (!settlement) throw ApiError.notFound('Settlement not found.');

  // Both cleared → COMPLETED
  if (settlement.accountingClearedAt) {
    await Settlement.findByIdAndUpdate(settlement._id, { status: 'COMPLETED' });
  }
  sendSuccess(res, settlement, 'Assets cleared.');
}));

export default router;
