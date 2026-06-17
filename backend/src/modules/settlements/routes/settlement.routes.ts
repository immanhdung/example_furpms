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

/**
 * @swagger
 * tags:
 *   name: Settlements
 *   description: Contract financial settlement
 */

/**
 * @swagger
 * /api/settlements/{id}/sign:
 *   post:
 *     summary: Sign a settlement document
 *     tags: [Settlements]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Settlement signed
 */
router.post('/:id/sign', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'SIGNED', signedAt: new Date(), signedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  );
  if (!settlement) throw ApiError.notFound('Settlement not found.');
  sendSuccess(res, settlement, 'Settlement signed.');
}));

/**
 * @swagger
 * /api/settlements/{id}/accounting-cleared:
 *   post:
 *     summary: Mark settlement as accounting cleared
 *     tags: [Settlements]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Accounting cleared
 */
router.post('/:id/accounting-cleared', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ACCOUNTING_CLEARED', accountingClearedAt: new Date() },
    { new: true },
  );
  if (!settlement) throw ApiError.notFound('Settlement not found.');
  sendSuccess(res, settlement, 'Accounting cleared.');
}));

/**
 * @swagger
 * /api/settlements/{id}/assets-cleared:
 *   post:
 *     summary: Mark settlement as assets cleared
 *     tags: [Settlements]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Assets cleared
 */
router.post('/:id/assets-cleared', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const settlement = await Settlement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: 'ASSETS_CLEARED', assetsClearedAt: new Date() },
    { new: true },
  );
  if (!settlement) throw ApiError.notFound('Settlement not found.');

  if (settlement.accountingClearedAt) {
    await Settlement.findByIdAndUpdate(settlement._id, { status: 'COMPLETED' });
  }
  sendSuccess(res, settlement, 'Assets cleared.');
}));

export default router;
