import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { ReviewRound } from '../models/reviewRound.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rounds
 *   description: Review round management
 */

/**
 * @swagger
 * /api/rounds/{roundId}/members:
 *   get:
 *     summary: Get reviewers assigned to a round
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Round members retrieved
 *   post:
 *     summary: Assign reviewer to round
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200:
 *         description: Reviewer assigned
 */
router.get('/:roundId/members', authenticate, asyncHandler(async (req, res) => {
  const round = await ReviewRound.findOne({ _id: req.params.roundId, isDeleted: false })
    .populate('assignedReviewers', 'fullName email department');
  if (!round) throw ApiError.notFound('Review round not found.');
  sendSuccess(res, round?.assignedReviewers ?? [], 'Round members retrieved.');
}));

router.post('/:roundId/members', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.body);
  const round = await ReviewRound.findOneAndUpdate(
    { _id: req.params.roundId, isDeleted: false },
    { $addToSet: { assignedReviewers: new mongoose.Types.ObjectId(userId) } },
    { new: true },
  ).populate('assignedReviewers', 'fullName email department');
  if (!round) throw ApiError.notFound('Review round not found.');
  sendSuccess(res, round.assignedReviewers, 'Reviewer assigned.');
}));

/**
 * @swagger
 * /api/rounds/{roundId}/members/{memberId}:
 *   delete:
 *     summary: Remove reviewer from round
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reviewer removed
 */
router.delete('/:roundId/members/:memberId', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const round = await ReviewRound.findOneAndUpdate(
    { _id: req.params.roundId, isDeleted: false },
    { $pull: { assignedReviewers: new mongoose.Types.ObjectId(req.params.memberId) } },
    { new: true },
  );
  if (!round) throw ApiError.notFound('Review round not found.');
  sendSuccess(res, null, 'Reviewer assignment removed.');
}));

/**
 * @swagger
 * /api/rounds/{roundId}/open:
 *   post:
 *     summary: Open a review round
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Round opened
 */
router.post('/:roundId/open', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const round = await ReviewRound.findOne({ _id: req.params.roundId, isDeleted: false });
  if (!round) throw ApiError.notFound('Review round not found.');
  if (round.status !== 'PENDING') throw ApiError.conflict('Round can only be opened from PENDING status.');

  if (round.prerequisiteRoundId) {
    const prereq = await ReviewRound.findById(round.prerequisiteRoundId);
    if (!prereq || prereq.status !== 'PASSED') {
      throw ApiError.conflict('Prerequisite round has not passed yet.');
    }
  }

  round.status = 'OPEN';
  round.openedAt = new Date();
  round.updatedBy = new mongoose.Types.ObjectId(req.user!.sub);
  await round.save();
  sendSuccess(res, round, 'Round opened.');
}));

/**
 * @swagger
 * /api/rounds/{roundId}/close:
 *   post:
 *     summary: Close a review round with result
 *     tags: [Rounds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [result]
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, REVISION_REQUIRED]
 *     responses:
 *       200:
 *         description: Round closed
 */
router.post('/:roundId/close', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { result } = z.object({
    result: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUIRED']),
  }).parse(req.body);

  const round = await ReviewRound.findOne({ _id: req.params.roundId, isDeleted: false });
  if (!round) throw ApiError.notFound('Review round not found.');
  if (round.status !== 'OPEN') throw ApiError.conflict('Round must be OPEN to close.');

  round.status = result === 'APPROVED' ? 'PASSED' : 'FAILED';
  round.result = result;
  round.closedAt = new Date();
  round.updatedBy = new mongoose.Types.ObjectId(req.user!.sub);
  await round.save();
  sendSuccess(res, round, 'Round closed.');
}));

export default router;
