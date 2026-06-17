import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { Proposal } from '../../proposals/models/proposal.model';
import { Contract } from '../../contracts/models/contract.model';
import { User } from '../../users/models/user.model';
import { Cycle } from '../../cycles/models/cycle.model';
import mongoose from 'mongoose';

const router = Router();

router.get('/overview', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (_req, res) => {
  const [
    totalProposals,
    submittedProposals,
    approvedProposals,
    rejectedProposals,
    activeContracts,
    totalUsers,
    activeCycles,
  ] = await Promise.all([
    Proposal.countDocuments({ isDeleted: false }),
    Proposal.countDocuments({ status: 'SUBMITTED', isDeleted: false }),
    Proposal.countDocuments({ status: 'APPROVED', isDeleted: false }),
    Proposal.countDocuments({ status: 'REJECTED', isDeleted: false }),
    Contract.countDocuments({ status: 'ACTIVE', isDeleted: false }),
    User.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
    Cycle.countDocuments({ status: 'OPEN', isDeleted: false }),
  ]);

  const totalBudgetAgg = await Proposal.aggregate([
    { $match: { status: 'APPROVED', isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalApprovedBudget = totalBudgetAgg[0]?.total ?? 0;

  sendSuccess(res, {
    proposals: { total: totalProposals, submitted: submittedProposals, approved: approvedProposals, rejected: rejectedProposals },
    contracts: { active: activeContracts },
    users: { total: totalUsers },
    cycles: { active: activeCycles },
    budget: { totalApproved: totalApprovedBudget },
  }, 'Analytics overview retrieved.');
}));

router.get('/by-track', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const matchStage: Record<string, unknown> = { isDeleted: false };
  if (req.query.cycleId) {
    const proposals = await Proposal.distinct('trackId', { isDeleted: false });
    matchStage.trackId = { $in: proposals };
  }

  const data = await Proposal.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$trackId',
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
        submitted: { $sum: { $cond: [{ $eq: ['$status', 'SUBMITTED'] }, 1, 0] } },
        totalBudget: { $sum: '$totalAmount' },
      },
    },
    {
      $lookup: {
        from: 'tracks',
        localField: '_id',
        foreignField: '_id',
        as: 'track',
      },
    },
    { $unwind: { path: '$track', preserveNullAndEmptyArrays: true } },
    { $project: { trackId: '$_id', trackName: '$track.name', total: 1, approved: 1, rejected: 1, submitted: 1, totalBudget: 1 } },
  ]);

  sendSuccess(res, data, 'Analytics by track retrieved.');
}));

router.get('/funnel', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const matchStage: Record<string, unknown> = { isDeleted: false };

  const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
  const counts = await Promise.all(
    statuses.map((s) => Proposal.countDocuments({ ...matchStage, status: s })),
  );

  const funnel = statuses.map((s, i) => ({ status: s, count: counts[i] }));
  sendSuccess(res, funnel, 'Status funnel retrieved.');
}));

export default router;
