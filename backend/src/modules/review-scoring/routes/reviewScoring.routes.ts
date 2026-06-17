import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { ReviewScore } from '../models/reviewScore.model';
import { CouncilDecision } from '../models/councilDecision.model';
import { RubricCriteria } from '../../master-data/models/rubricCriteria.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { Proposal } from '../../proposals/models/proposal.model';
import { ReviewRound } from '../../rounds/models/reviewRound.model';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Review Scoring
 *   description: Reviewer scoring and council decisions
 */

/**
 * @swagger
 * /api/review-scoring/rubrics:
 *   get:
 *     summary: List all rubric criteria
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: roundType
 *         schema: { type: string, enum: [SCREENING, REVIEW, ACCEPTANCE] }
 *     responses:
 *       200:
 *         description: Rubrics retrieved
 */
router.get('/rubrics', authenticate, asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { isDeleted: false, isActive: true };
  if (req.query.roundType) filter.roundType = req.query.roundType;
  const rubrics = await RubricCriteria.find(filter).sort({ sequence: 1 });
  sendSuccess(res, rubrics, 'Rubrics retrieved.');
}));

/**
 * @swagger
 * /api/review-scoring/rubrics/{id}:
 *   get:
 *     summary: Get rubric criterion by ID
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rubric retrieved
 */
router.get('/rubrics/:id', authenticate, asyncHandler(async (req, res) => {
  const rubric = await RubricCriteria.findOne({ _id: req.params.id, isDeleted: false });
  if (!rubric) throw ApiError.notFound('Rubric not found.');
  sendSuccess(res, rubric, 'Rubric retrieved.');
}));

/**
 * @swagger
 * /api/review-scoring/councils/{councilId}/scores:
 *   post:
 *     summary: Submit reviewer score for a council
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scoreDetails]
 *             properties:
 *               generalComments: { type: string }
 *               otherRecommendations: { type: string }
 *               scoreDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [criterionId, givenScore]
 *                   properties:
 *                     criterionId: { type: string }
 *                     givenScore: { type: number }
 *                     comments: { type: string }
 *     responses:
 *       200:
 *         description: Score submitted
 *   get:
 *     summary: Get all scores for a council (Admin/Staff only)
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: All scores retrieved
 */
router.post('/councils/:councilId/scores', authenticate, asyncHandler(async (req, res) => {
  const schema = z.object({
    templateId: z.string().optional(),
    generalComments: z.string().optional(),
    otherRecommendations: z.string().optional(),
    scoreDetails: z.array(z.object({
      criterionId: z.string(),
      givenScore: z.number().min(0),
      comments: z.string().optional(),
    })),
  });
  const dto = schema.parse(req.body);

  const totalScore = dto.scoreDetails.reduce((sum, d) => sum + d.givenScore, 0);
  const existing = await ReviewScore.findOne({ councilId: req.params.councilId, reviewerId: req.user!.sub });
  let score;
  if (existing) {
    score = await ReviewScore.findByIdAndUpdate(existing._id, {
      ...dto,
      totalScore,
      scoreDetails: dto.scoreDetails.map((d) => ({ ...d, criterionId: new mongoose.Types.ObjectId(d.criterionId) })),
      submittedAt: new Date(),
    }, { new: true });
  } else {
    score = await new ReviewScore({
      councilId: new mongoose.Types.ObjectId(req.params.councilId),
      reviewerId: new mongoose.Types.ObjectId(req.user!.sub),
      templateId: dto.templateId ? new mongoose.Types.ObjectId(dto.templateId) : undefined,
      generalComments: dto.generalComments,
      otherRecommendations: dto.otherRecommendations,
      totalScore,
      scoreDetails: dto.scoreDetails.map((d) => ({ ...d, criterionId: new mongoose.Types.ObjectId(d.criterionId) })),
    }).save();
  }
  sendSuccess(res, score, 'Score submitted.');
}));

/**
 * @swagger
 * /api/review-scoring/councils/{councilId}/scores/my:
 *   get:
 *     summary: Get my score for a council
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: My score retrieved
 */
router.get('/councils/:councilId/scores/my', authenticate, asyncHandler(async (req, res) => {
  const score = await ReviewScore.findOne({
    councilId: req.params.councilId,
    reviewerId: req.user!.sub,
    isDeleted: false,
  }).populate('scoreDetails.criterionId', 'name code maxScore');
  sendSuccess(res, score, 'My score retrieved.');
}));

router.get('/councils/:councilId/scores', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const scores = await ReviewScore.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('reviewerId', 'fullName email')
    .populate('scoreDetails.criterionId', 'name code maxScore');
  sendSuccess(res, scores, 'All scores retrieved.');
}));

/**
 * @swagger
 * /api/review-scoring/councils/{councilId}/decision:
 *   post:
 *     summary: Submit council decision
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
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
 *               councilComments: { type: string }
 *               recommendations: { type: string }
 *               chairUserId: { type: string }
 *               secretaryUserId: { type: string }
 *     responses:
 *       200:
 *         description: Council decision finalized
 *   get:
 *     summary: Get council decision
 *     tags: [Review Scoring]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Council decision retrieved
 */
router.post('/councils/:councilId/decision', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    result: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUIRED']),
    councilComments: z.string().optional(),
    recommendations: z.string().optional(),
    chairUserId: z.string().optional(),
    secretaryUserId: z.string().optional(),
  });
  const dto = schema.parse(req.body);

  const allScores = await ReviewScore.find({ councilId: req.params.councilId, isDeleted: false });
  const averageScore = allScores.length
    ? allScores.reduce((s, r) => s + r.totalScore, 0) / allScores.length
    : 0;

  const existing = await CouncilDecision.findOne({ councilId: req.params.councilId });
  let decision;
  if (existing) {
    decision = await CouncilDecision.findByIdAndUpdate(existing._id, { ...dto, averageScore }, { new: true });
  } else {
    decision = await new CouncilDecision({
      councilId: new mongoose.Types.ObjectId(req.params.councilId),
      ...dto,
      chairUserId: dto.chairUserId ? new mongoose.Types.ObjectId(dto.chairUserId) : undefined,
      secretaryUserId: dto.secretaryUserId ? new mongoose.Types.ObjectId(dto.secretaryUserId) : undefined,
      averageScore,
      createdBy: new mongoose.Types.ObjectId(req.user!.sub),
    }).save();
  }

  const round = await ReviewRound.findOne({ councilId: req.params.councilId });
  if (round) {
    const proposalStatus = dto.result === 'APPROVED' ? 'APPROVED' : dto.result === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW';
    if (dto.result === 'APPROVED' || dto.result === 'REJECTED') {
      await Proposal.findByIdAndUpdate(round.proposalId, { status: proposalStatus });
    }
  }

  sendSuccess(res, decision, 'Council decision finalized.');
}));

router.get('/councils/:councilId/decision', authenticate, asyncHandler(async (req, res) => {
  const decision = await CouncilDecision.findOne({ councilId: req.params.councilId, isDeleted: false })
    .populate('chairUserId', 'fullName email')
    .populate('secretaryUserId', 'fullName email');
  sendSuccess(res, decision, 'Council decision retrieved.');
}));

export default router;
