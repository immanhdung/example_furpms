import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { ReviewRound } from '../../rounds/models/reviewRound.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import {
  listProposals, getMyProposals, getProposal, createProposal, updateProposal,
  submitProposal, withdrawProposal, getBudget, updateBudget, getLaborDetails, updateLaborDetail,
  getTeamMembers, addTeamMember, getResearchContents, addResearchContent, updateResearchContent,
  deleteResearchContent, addActivity, updateActivity, deleteActivity, getExpectedProducts,
  addExpectedProduct, updateExpectedProduct, deleteExpectedProduct,
} from '../controllers/proposal.controller';
import { getAiSummary, generateAiSummary, editAiSummary } from '../../ai/controllers/ai.controller';

const router = Router();

router.get('/', authenticate, listProposals);
router.get('/my', authenticate, getMyProposals);
router.get('/:id', authenticate, getProposal);
router.post('/', authenticate, createProposal);
router.put('/:id', authenticate, updateProposal);
router.post('/:id/submit', authenticate, submitProposal);
router.patch('/:id/withdraw', authenticate, withdrawProposal);

// Budget
router.get('/:id/budget', authenticate, getBudget);
router.put('/:id/budget', authenticate, updateBudget);
router.get('/:id/budget/labor', authenticate, getLaborDetails);
router.put('/:id/budget/labor/:detailId', authenticate, updateLaborDetail);

// Team members
router.get('/:id/team-members', authenticate, getTeamMembers);
router.post('/:id/team-members', authenticate, addTeamMember);

// Research contents
router.get('/:id/research-contents', authenticate, getResearchContents);
router.post('/:id/research-contents', authenticate, addResearchContent);
router.put('/:id/research-contents/:contentId', authenticate, updateResearchContent);
router.delete('/:id/research-contents/:contentId', authenticate, deleteResearchContent);

// Activities
router.post('/:id/research-contents/:contentId/activities', authenticate, addActivity);
router.put('/:id/activities/:activityId', authenticate, updateActivity);
router.delete('/:id/activities/:activityId', authenticate, deleteActivity);

// Expected products
router.get('/:id/expected-products', authenticate, getExpectedProducts);
router.post('/:id/expected-products', authenticate, addExpectedProduct);
router.put('/:id/expected-products/:productId', authenticate, updateExpectedProduct);
router.delete('/:id/expected-products/:productId', authenticate, deleteExpectedProduct);

// AI Summary
router.get('/:id/summary', authenticate, getAiSummary);
router.post('/:id/generate-summary', authenticate, generateAiSummary);
router.patch('/:id/summary', authenticate, editAiSummary);

// Review rounds (nested under proposals)
router.get('/:proposalId/rounds', authenticate, asyncHandler(async (req, res) => {
  const rounds = await ReviewRound.find({ proposalId: req.params.proposalId, isDeleted: false })
    .populate('councilId', 'councilType status')
    .sort({ sequence: 1 });
  sendSuccess(res, rounds, 'Review rounds retrieved.');
}));

router.post('/:proposalId/rounds', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    roundType: z.enum(['SCREENING', 'REVIEW', 'ACCEPTANCE']),
    dimension: z.enum(['SCIENCE', 'FINANCE']).optional().default('SCIENCE'),
    prerequisiteRoundId: z.string().optional(),
    rubricTemplateId: z.string().optional(),
  });
  const dto = schema.parse(req.body);
  const lastRound = await ReviewRound.findOne({ proposalId: req.params.proposalId, isDeleted: false }).sort({ roundNumber: -1 });
  const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
  const round = await new ReviewRound({
    proposalId: new mongoose.Types.ObjectId(req.params.proposalId),
    roundNumber,
    sequence: roundNumber,
    roundType: dto.roundType,
    dimension: dto.dimension,
    prerequisiteRoundId: dto.prerequisiteRoundId ? new mongoose.Types.ObjectId(dto.prerequisiteRoundId) : undefined,
    rubricTemplateId: dto.rubricTemplateId ? new mongoose.Types.ObjectId(dto.rubricTemplateId) : undefined,
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, round, 'Review round created.');
}));

// Export stubs (Swagger docs show these; full implementation requires docx/xlsx libraries)
router.get('/:id/export/scientific', authenticate, (_req, res) => {
  res.status(501).json({ success: false, message: 'Export to Word not yet implemented.', data: null, errors: null });
});
router.get('/:id/export/budget', authenticate, (_req, res) => {
  res.status(501).json({ success: false, message: 'Export to Excel not yet implemented.', data: null, errors: null });
});

export default router;
