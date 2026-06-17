import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { Disbursement } from '../models/disbursement.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Disbursements
 *   description: Contract disbursement management
 */

/**
 * @swagger
 * /api/disbursements/{id}/confirm:
 *   post:
 *     summary: Confirm a disbursement payment
 *     tags: [Disbursements]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [actualAmount, bankReference]
 *             properties:
 *               actualAmount: { type: number, example: 50000000 }
 *               bankReference: { type: string, example: "TT20260617001" }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Disbursement confirmed
 *       404:
 *         description: Disbursement not found
 */
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
