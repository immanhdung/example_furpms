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

/**
 * @swagger
 * tags:
 *   name: Amendments
 *   description: Contract amendment management
 */

/**
 * @swagger
 * /api/amendments/{id}:
 *   get:
 *     summary: Get amendment by ID
 *     tags: [Amendments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Amendment retrieved
 *       404:
 *         description: Amendment not found
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const amendment = await Amendment.findOne({ _id: req.params.id, isDeleted: false })
    .populate('contractId', 'contractNumber status')
    .populate('reviewedBy', 'fullName email');
  if (!amendment) throw ApiError.notFound('Amendment not found.');
  sendSuccess(res, amendment, 'Amendment retrieved.');
}));

/**
 * @swagger
 * /api/amendments/{id}/approve:
 *   post:
 *     summary: Approve an amendment request
 *     tags: [Amendments]
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
 *               reviewerComments: { type: string }
 *     responses:
 *       200:
 *         description: Amendment approved
 */
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

/**
 * @swagger
 * /api/amendments/{id}/reject:
 *   post:
 *     summary: Reject an amendment request
 *     tags: [Amendments]
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
 *               reviewerComments: { type: string }
 *     responses:
 *       200:
 *         description: Amendment rejected
 */
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
