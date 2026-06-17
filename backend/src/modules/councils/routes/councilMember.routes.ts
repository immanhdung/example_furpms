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

// PATCH /api/council-members/:memberId/respond
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

// DELETE /api/council-members/:memberId
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
