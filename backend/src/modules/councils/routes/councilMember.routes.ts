import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { z } from 'zod';
import { CouncilMember } from '../models/councilMember.model';
import { ApiError } from '../../../shared/apiError';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Council Members
 *   description: Council membership management
 */

/**
 * @swagger
 * /api/council-members/{memberId}/respond:
 *   patch:
 *     summary: Respond to council membership invitation
 *     tags: [Council Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED]
 *               responseNote: { type: string }
 *     responses:
 *       200:
 *         description: Response recorded
 *       403:
 *         description: Forbidden - not your membership
 */
router.patch('/:memberId/respond', authenticate, asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.enum(['ACCEPTED', 'DECLINED']),
    responseNote: z.string().optional(),
  });
  const { status, responseNote } = schema.parse(req.body);

  const member = await CouncilMember.findOne({ _id: req.params.memberId, isDeleted: false });
  if (!member) throw ApiError.notFound('Council member not found.');
  if (member.userId.toString() !== req.user!.sub) throw ApiError.forbidden();

  member.status = status;
  member.responseNote = responseNote;
  member.respondedAt = new Date();
  await member.save();
  sendSuccess(res, member, 'Response recorded.');
}));

/**
 * @swagger
 * /api/council-members/{memberId}:
 *   delete:
 *     summary: Remove a council member
 *     tags: [Council Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Council member removed
 */
router.delete('/:memberId', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const member = await CouncilMember.findOneAndUpdate(
    { _id: req.params.memberId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );
  if (!member) throw ApiError.notFound('Council member not found.');
  sendSuccess(res, null, 'Council member removed.');
}));

export default router;
