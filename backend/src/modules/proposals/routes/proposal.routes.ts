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

/**
 * @swagger
 * tags:
 *   name: Proposals
 *   description: Research proposal management
 */

/**
 * @swagger
 * /api/proposals:
 *   get:
 *     summary: List all proposals
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED] }
 *       - in: query
 *         name: cycleId
 *         schema: { type: string }
 *       - in: query
 *         name: trackId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposals retrieved
 *   post:
 *     summary: Create a new research proposal
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titleVI, titleEN, cycleId]
 *             properties:
 *               titleVI: { type: string, example: "Ứng dụng AI trong quản lý nghiên cứu" }
 *               titleEN: { type: string, example: "AI Application in Research Management" }
 *               cycleId: { type: string }
 *               trackId: { type: string }
 *               abstract: { type: string }
 *               keywords: { type: array, items: { type: string } }
 *               fundingMethod: { type: string, enum: [WHOLE, PARTIAL] }
 *               totalAmount: { type: number }
 *     responses:
 *       201:
 *         description: Proposal created
 */
router.get('/', authenticate, listProposals);
router.post('/', authenticate, createProposal);

/**
 * @swagger
 * /api/proposals/my:
 *   get:
 *     summary: Get proposals I submitted (as PI)
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: My proposals retrieved
 */
router.get('/my', authenticate, getMyProposals);

/**
 * @swagger
 * /api/proposals/{id}:
 *   get:
 *     summary: Get proposal by ID
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposal retrieved
 *   put:
 *     summary: Update proposal
 *     tags: [Proposals]
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
 *               titleVI: { type: string }
 *               titleEN: { type: string }
 *               abstract: { type: string }
 *               keywords: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Proposal updated
 */
router.get('/:id', authenticate, getProposal);
router.put('/:id', authenticate, updateProposal);

/**
 * @swagger
 * /api/proposals/{id}/submit:
 *   post:
 *     summary: Submit proposal for review
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposal submitted
 */
router.post('/:id/submit', authenticate, submitProposal);

/**
 * @swagger
 * /api/proposals/{id}/withdraw:
 *   patch:
 *     summary: Withdraw a submitted proposal
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposal withdrawn
 */
router.patch('/:id/withdraw', authenticate, withdrawProposal);

/**
 * @swagger
 * /api/proposals/{id}/budget:
 *   get:
 *     summary: Get proposal budget breakdown
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Budget retrieved
 *   put:
 *     summary: Update proposal budget
 *     tags: [Proposals]
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
 *               totalAmount: { type: number }
 *               items: { type: array }
 *     responses:
 *       200:
 *         description: Budget updated
 */
router.get('/:id/budget', authenticate, getBudget);
router.put('/:id/budget', authenticate, updateBudget);

/**
 * @swagger
 * /api/proposals/{id}/budget/labor:
 *   get:
 *     summary: Get labor cost details
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Labor details retrieved
 */
router.get('/:id/budget/labor', authenticate, getLaborDetails);

/**
 * @swagger
 * /api/proposals/{id}/budget/labor/{detailId}:
 *   put:
 *     summary: Update a labor cost detail
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysWorked: { type: number }
 *               roleTypeId: { type: string }
 *     responses:
 *       200:
 *         description: Labor detail updated
 */
router.put('/:id/budget/labor/:detailId', authenticate, updateLaborDetail);

/**
 * @swagger
 * /api/proposals/{id}/team-members:
 *   get:
 *     summary: Get proposal team members
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team members retrieved
 *   post:
 *     summary: Add team member to proposal
 *     tags: [Proposals]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *               role: { type: string }
 *               contributionPercent: { type: number }
 *     responses:
 *       201:
 *         description: Team member added
 */
router.get('/:id/team-members', authenticate, getTeamMembers);
router.post('/:id/team-members', authenticate, addTeamMember);

/**
 * @swagger
 * /api/proposals/{id}/research-contents:
 *   get:
 *     summary: Get research contents
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Research contents retrieved
 *   post:
 *     summary: Add research content
 *     tags: [Proposals]
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
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               sequence: { type: integer }
 *     responses:
 *       201:
 *         description: Research content added
 */
router.get('/:id/research-contents', authenticate, getResearchContents);
router.post('/:id/research-contents', authenticate, addResearchContent);

/**
 * @swagger
 * /api/proposals/{id}/research-contents/{contentId}:
 *   put:
 *     summary: Update research content
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Research content updated
 *   delete:
 *     summary: Delete research content
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Research content deleted
 */
router.put('/:id/research-contents/:contentId', authenticate, updateResearchContent);
router.delete('/:id/research-contents/:contentId', authenticate, deleteResearchContent);

/**
 * @swagger
 * /api/proposals/{id}/research-contents/{contentId}/activities:
 *   post:
 *     summary: Add activity to research content
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               startMonth: { type: integer }
 *               endMonth: { type: integer }
 *               responsible: { type: string }
 *     responses:
 *       201:
 *         description: Activity added
 */
router.post('/:id/research-contents/:contentId/activities', authenticate, addActivity);

/**
 * @swagger
 * /api/proposals/{id}/activities/{activityId}:
 *   put:
 *     summary: Update an activity
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               startMonth: { type: integer }
 *               endMonth: { type: integer }
 *     responses:
 *       200:
 *         description: Activity updated
 *   delete:
 *     summary: Delete an activity
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Activity deleted
 */
router.put('/:id/activities/:activityId', authenticate, updateActivity);
router.delete('/:id/activities/:activityId', authenticate, deleteActivity);

/**
 * @swagger
 * /api/proposals/{id}/expected-products:
 *   get:
 *     summary: Get expected products
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Expected products retrieved
 *   post:
 *     summary: Add expected product
 *     tags: [Proposals]
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
 *             required: [name, categoryId]
 *             properties:
 *               name: { type: string }
 *               categoryId: { type: string }
 *               quantity: { type: integer }
 *               unit: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Expected product added
 */
router.get('/:id/expected-products', authenticate, getExpectedProducts);
router.post('/:id/expected-products', authenticate, addExpectedProduct);

/**
 * @swagger
 * /api/proposals/{id}/expected-products/{productId}:
 *   put:
 *     summary: Update expected product
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Expected product updated
 *   delete:
 *     summary: Delete expected product
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Expected product deleted
 */
router.put('/:id/expected-products/:productId', authenticate, updateExpectedProduct);
router.delete('/:id/expected-products/:productId', authenticate, deleteExpectedProduct);

/**
 * @swagger
 * /api/proposals/{id}/summary:
 *   get:
 *     summary: Get AI-generated summary
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: AI summary retrieved
 *   patch:
 *     summary: Edit AI summary manually
 *     tags: [Proposals]
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
 *             required: [summary]
 *             properties:
 *               summary: { type: string }
 *     responses:
 *       200:
 *         description: AI summary updated
 */
router.get('/:id/summary', authenticate, getAiSummary);
router.patch('/:id/summary', authenticate, editAiSummary);

/**
 * @swagger
 * /api/proposals/{id}/generate-summary:
 *   post:
 *     summary: Generate AI summary using Gemini
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: AI summary generated
 *       503:
 *         description: Gemini API not configured
 */
router.post('/:id/generate-summary', authenticate, generateAiSummary);

/**
 * @swagger
 * /api/proposals/{proposalId}/rounds:
 *   get:
 *     summary: Get review rounds for a proposal
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review rounds retrieved
 *   post:
 *     summary: Create a review round for a proposal
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roundType]
 *             properties:
 *               roundType:
 *                 type: string
 *                 enum: [SCREENING, REVIEW, ACCEPTANCE]
 *               dimension:
 *                 type: string
 *                 enum: [SCIENCE, FINANCE]
 *               prerequisiteRoundId: { type: string }
 *               rubricTemplateId: { type: string }
 *     responses:
 *       201:
 *         description: Review round created
 */
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

/**
 * @swagger
 * /api/proposals/{id}/export/scientific:
 *   get:
 *     summary: Export proposal to Word (not yet implemented)
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.get('/:id/export/scientific', authenticate, (_req, res) => {
  res.status(501).json({ success: false, message: 'Export to Word not yet implemented.', data: null, errors: null });
});

/**
 * @swagger
 * /api/proposals/{id}/export/budget:
 *   get:
 *     summary: Export budget to Excel (not yet implemented)
 *     tags: [Proposals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.get('/:id/export/budget', authenticate, (_req, res) => {
  res.status(501).json({ success: false, message: 'Export to Excel not yet implemented.', data: null, errors: null });
});

export default router;
