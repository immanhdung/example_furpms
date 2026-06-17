import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { Deliverable } from '../models/deliverable.model';
import { Disbursement } from '../../disbursements/models/disbursement.model';
import { Contract } from '../../contracts/models/contract.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Deliverables
 *   description: Contract deliverable management
 */

/**
 * @swagger
 * /api/deliverables/{id}/submit:
 *   post:
 *     summary: Submit a deliverable
 *     tags: [Deliverables]
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
 *             required: [fileUrl]
 *             properties:
 *               fileUrl: { type: string, format: uri }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Deliverable submitted
 *       404:
 *         description: Deliverable not found
 */
router.post('/:id/submit', authenticate, asyncHandler(async (req, res) => {
  const schema = z.object({
    fileUrl: z.string().url(),
    description: z.string().optional(),
    acceptanceStatus: z.string().optional(),
    qualityAssessment: z.string().optional(),
  });
  const dto = schema.parse(req.body);

  const deliverable = await Deliverable.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      fileUrl: dto.fileUrl,
      acceptanceStatus: 'SUBMITTED',
      submittedAt: new Date(),
      submittedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!deliverable) throw ApiError.notFound('Deliverable not found.');
  sendSuccess(res, deliverable, 'Deliverable submitted.');
}));

/**
 * @swagger
 * /api/deliverables/{id}/evaluate:
 *   post:
 *     summary: Evaluate a submitted deliverable
 *     tags: [Deliverables]
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
 *             required: [acceptanceStatus]
 *             properties:
 *               acceptanceStatus:
 *                 type: string
 *                 enum: [PASSED, FAILED]
 *               qualityAssessment: { type: string }
 *     responses:
 *       200:
 *         description: Deliverable evaluated
 *       404:
 *         description: Deliverable not found
 */
router.post('/:id/evaluate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    acceptanceStatus: z.enum(['PASSED', 'FAILED']),
    qualityAssessment: z.string().optional(),
  });
  const dto = schema.parse(req.body);

  const deliverable = await Deliverable.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      acceptanceStatus: dto.acceptanceStatus,
      qualityAssessment: dto.qualityAssessment,
      isCompleted: dto.acceptanceStatus === 'PASSED',
      evaluatedAt: new Date(),
      evaluatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!deliverable) throw ApiError.notFound('Deliverable not found.');

  if (dto.acceptanceStatus === 'PASSED') {
    const contract = await Contract.findById(deliverable.contractId);
    if (contract?.fundingMethod === 'PARTIAL') {
      await Disbursement.findOneAndUpdate(
        { deliverableId: deliverable._id, contractId: deliverable.contractId },
        { status: 'PENDING' },
      );
    }

    const allDeliverables = await Deliverable.find({ contractId: deliverable.contractId, isDeleted: false });
    const allPassed = allDeliverables.every((d) => d.acceptanceStatus === 'PASSED' || d._id.equals(deliverable._id));
    if (allPassed) {
      await Contract.findByIdAndUpdate(deliverable.contractId, { status: 'COMPLETED' });
    }
  } else {
    await Contract.findByIdAndUpdate(deliverable.contractId, { status: 'UNDER_REVIEW' });
  }

  sendSuccess(res, deliverable, 'Deliverable evaluated.');
}));

export default router;
