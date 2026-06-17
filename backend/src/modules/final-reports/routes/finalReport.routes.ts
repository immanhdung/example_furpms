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

/**
 * @swagger
 * tags:
 *   name: Final Reports
 *   description: Contract final report management
 */

const CreateSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(10),
  achievements: z.string().min(10),
  challenges: z.string().optional(),
  recommendations: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional().default([]),
});

/**
 * @swagger
 * /api/final-reports/{contractId}:
 *   get:
 *     summary: Get final report for a contract
 *     tags: [Final Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Final report retrieved
 */
router.get('/:contractId', authenticate, asyncHandler(async (req, res) => {
  const report = await FinalReport.findOne({ contractId: req.params.contractId, isDeleted: false });
  sendSuccess(res, report, 'Final report retrieved.');
}));

/**
 * @swagger
 * /api/final-reports/{contractId}/submit:
 *   post:
 *     summary: Submit final report for a contract
 *     tags: [Final Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, summary, achievements]
 *             properties:
 *               title: { type: string }
 *               summary: { type: string }
 *               achievements: { type: string }
 *               challenges: { type: string }
 *               recommendations: { type: string }
 *               attachmentUrls: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Final report submitted
 */
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

/**
 * @swagger
 * /api/final-reports/{id}/request-revision:
 *   post:
 *     summary: Request revision of a final report
 *     tags: [Final Reports]
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
 *               revisionNotes: { type: string }
 *     responses:
 *       200:
 *         description: Revision requested
 */
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

/**
 * @swagger
 * /api/final-reports/{id}/accept:
 *   post:
 *     summary: Accept a final report
 *     tags: [Final Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Final report accepted and contract marked completed
 */
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

/**
 * @swagger
 * /api/final-reports/{id}/archive:
 *   post:
 *     summary: Archive a final report
 *     tags: [Final Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Final report archived
 */
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
