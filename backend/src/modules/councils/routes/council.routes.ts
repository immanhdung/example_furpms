import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { Council } from '../models/council.model';
import { CouncilMember } from '../models/councilMember.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { ReviewRound } from '../../rounds/models/reviewRound.model';
import { ReviewerFeedback } from '../../review-scoring/models/reviewerFeedback.model';
import { AcceptanceReview } from '../../review-scoring/models/acceptanceReview.model';
import { Meeting } from '../../meetings/models/meeting.model';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Councils
 *   description: Review council management
 */

const CreateCouncilSchema = z.object({
  proposalId: z.string(),
  roundId: z.string().optional(),
  councilType: z.string(),
  councilStage: z.enum(['PROPOSAL', 'FINAL_REPORT']).default('PROPOSAL'),
  meetLink: z.string().url().optional().or(z.literal('')),
  establishmentDecisionNo: z.string().optional(),
  establishedAt: z.string().datetime().optional(),
  meetingDeadline: z.string().datetime().optional(),
  minMembersRequired: z.number().int().min(1).optional().default(3),
  maxMembersAllowed: z.number().int().min(1).optional().default(5),
});

/**
 * @swagger
 * /api/councils/my-memberships:
 *   get:
 *     summary: Get councils I am a member of
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Council memberships retrieved
 */
router.get('/my-memberships', authenticate, asyncHandler(async (req, res) => {
  const memberships = await CouncilMember.find({ userId: req.user!.sub, isDeleted: false })
    .populate({ path: 'councilId', populate: { path: 'proposalId', select: 'titleVI titleEN status' } });
  sendSuccess(res, memberships, 'My council memberships retrieved.');
}));

/**
 * @swagger
 * /api/councils:
 *   post:
 *     summary: Establish a new review council
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proposalId, councilType]
 *             properties:
 *               proposalId: { type: string }
 *               roundId: { type: string }
 *               councilType: { type: string, example: SCREENING }
 *               establishmentDecisionNo: { type: string }
 *               establishedAt: { type: string, format: date-time }
 *               meetingDeadline: { type: string, format: date-time }
 *               minMembersRequired: { type: integer, default: 3 }
 *               maxMembersAllowed: { type: integer, default: 5 }
 *     responses:
 *       201:
 *         description: Council established
 */
router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const dto = CreateCouncilSchema.parse(req.body);
  const council = await new Council({
    ...dto,
    proposalId: new mongoose.Types.ObjectId(dto.proposalId),
    roundId: dto.roundId ? new mongoose.Types.ObjectId(dto.roundId) : undefined,
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();

  if (dto.roundId) {
    await ReviewRound.findByIdAndUpdate(dto.roundId, { councilId: council._id });
  }
  sendCreated(res, council, 'Council established.');
}));

/**
 * @swagger
 * /api/councils/{councilId}/members:
 *   get:
 *     summary: Get council members
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Council members retrieved
 *   post:
 *     summary: Add member to council
 *     tags: [Councils]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *               memberRole: { type: string, default: MEMBER }
 *               isExternal: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Council member added
 */
router.get('/:councilId/members', authenticate, asyncHandler(async (req, res) => {
  const members = await CouncilMember.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('userId', 'fullName email department academicDegree');
  sendSuccess(res, members, 'Council members retrieved.');
}));

router.post('/:councilId/members', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    userId: z.string(),
    memberRole: z.string().default('MEMBER'),
    isExternal: z.boolean().default(false),
  });
  const dto = schema.parse(req.body);

  const existing = await CouncilMember.findOne({ councilId: req.params.councilId, userId: dto.userId, isDeleted: false });
  if (existing) throw ApiError.conflict('User is already a member of this council.');

  const member = await new CouncilMember({
    councilId: new mongoose.Types.ObjectId(req.params.councilId),
    userId: new mongoose.Types.ObjectId(dto.userId),
    memberRole: dto.memberRole,
    isExternal: dto.isExternal,
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, member, 'Council member added.');
}));

/**
 * @swagger
 * /api/councils/{councilId}/meetings:
 *   get:
 *     summary: Get council meetings
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Council meetings retrieved
 *   post:
 *     summary: Schedule a council meeting
 *     tags: [Councils]
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
 *             required: [scheduledAt]
 *             properties:
 *               title: { type: string }
 *               platform: { type: string, enum: [IN_PERSON, ONLINE, HYBRID], default: IN_PERSON }
 *               meetingLink: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               durationMinutes: { type: integer, default: 120 }
 *               agenda: { type: string }
 *     responses:
 *       201:
 *         description: Meeting scheduled
 */
router.get('/:councilId/meetings', authenticate, asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({ councilId: req.params.councilId, isDeleted: false }).sort({ scheduledAt: 1 });
  sendSuccess(res, meetings, 'Council meetings retrieved.');
}));

router.post('/:councilId/meetings', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const schema = z.object({
    title: z.string().optional(),
    platform: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).default('IN_PERSON'),
    meetingLink: z.string().optional(),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.number().int().default(120),
    agenda: z.string().optional(),
  });
  const dto = schema.parse(req.body);
  const meeting = await new Meeting({
    ...dto,
    councilId: new mongoose.Types.ObjectId(req.params.councilId),
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, meeting, 'Meeting scheduled.');
}));

/**
 * @swagger
 * /api/councils/{councilId}/feedback:
 *   get:
 *     summary: Get reviewer feedback for council (Admin/Staff only)
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feedback retrieved
 *   post:
 *     summary: Submit reviewer feedback
 *     tags: [Councils]
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
 *             properties:
 *               urgencyScore: { type: number, minimum: 1, maximum: 5 }
 *               scientificContributionScore: { type: number, minimum: 1, maximum: 5 }
 *               practicalSignificanceScore: { type: number, minimum: 1, maximum: 5 }
 *               actualVsExpectedScore: { type: number, minimum: 1, maximum: 5 }
 *               overallAssessment: { type: string }
 *               otherComments: { type: string }
 *     responses:
 *       200:
 *         description: Feedback submitted
 */
router.get('/:councilId/feedback', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const feedbacks = await ReviewerFeedback.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('reviewerId', 'fullName email');
  sendSuccess(res, feedbacks, 'Feedback retrieved.');
}));

router.post('/:councilId/feedback', authenticate, asyncHandler(async (req, res) => {
  const schema = z.object({
    urgencyScore: z.number().min(1).max(5).optional(),
    scientificContributionScore: z.number().min(1).max(5).optional(),
    practicalSignificanceScore: z.number().min(1).max(5).optional(),
    actualVsExpectedScore: z.number().min(1).max(5).optional(),
    overallAssessment: z.string().optional(),
    otherComments: z.string().optional(),
  });
  const dto = schema.parse(req.body);

  const existing = await ReviewerFeedback.findOne({ councilId: req.params.councilId, reviewerId: req.user!.sub });
  let feedback;
  if (existing) {
    feedback = await ReviewerFeedback.findByIdAndUpdate(existing._id, dto, { new: true });
  } else {
    feedback = await new ReviewerFeedback({
      ...dto,
      councilId: new mongoose.Types.ObjectId(req.params.councilId),
      reviewerId: new mongoose.Types.ObjectId(req.user!.sub),
    }).save();
  }
  sendSuccess(res, feedback, 'Feedback submitted.');
}));

/**
 * @swagger
 * /api/councils/{councilId}/acceptance:
 *   get:
 *     summary: Get acceptance reviews for council (Admin/Staff only)
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Acceptance reviews retrieved
 *   post:
 *     summary: Submit acceptance review
 *     tags: [Councils]
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
 *                 enum: [PASS, FAIL]
 *               failReason: { type: string }
 *     responses:
 *       200:
 *         description: Acceptance review submitted
 */
router.get('/:councilId/acceptance', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const reviews = await AcceptanceReview.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('reviewerId', 'fullName email');
  sendSuccess(res, reviews, 'Acceptance reviews retrieved.');
}));

router.post('/:councilId/acceptance', authenticate, asyncHandler(async (req, res) => {
  const schema = z.object({
    result: z.enum(['PASS', 'FAIL']),
    failReason: z.string().optional(),
  });
  const dto = schema.parse(req.body);

  const review = await new AcceptanceReview({
    councilId: new mongoose.Types.ObjectId(req.params.councilId),
    reviewerId: new mongoose.Types.ObjectId(req.user!.sub),
    result: dto.result === 'PASS' ? 'PASSED' : 'FAILED',
    failReason: dto.failReason,
  }).save();
  sendSuccess(res, review, 'Acceptance review submitted.');
}));

/**
 * @swagger
 * /api/councils/{councilId}/confirm-result:
 *   post:
 *     summary: Chairman confirms and locks council result (cannot be undone)
 *     tags: [Councils]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: councilId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Result confirmed and locked
 */
router.post('/:councilId/confirm-result', authenticate, asyncHandler(async (req, res) => {
  const council = await Council.findOne({ _id: req.params.councilId, isDeleted: false });
  if (!council) throw ApiError.notFound('Council not found.');
  if (council.isResultConfirmed) throw ApiError.conflict('Council result has already been confirmed.');

  const chairMembership = await CouncilMember.findOne({
    councilId: council._id,
    userId: req.user!.sub,
    memberRole: 'CHAIRMAN',
    isDeleted: false,
  });
  if (!chairMembership) throw ApiError.forbidden('Only the council chairman can confirm the result.');

  const updated = await Council.findByIdAndUpdate(
    council._id,
    {
      isResultConfirmed: true,
      resultConfirmedAt: new Date(),
      resultConfirmedBy: new mongoose.Types.ObjectId(req.user!.sub),
      status: 'COMPLETED',
    },
    { new: true },
  );
  sendSuccess(res, updated, 'Council result confirmed and locked.');
}));

export default router;
