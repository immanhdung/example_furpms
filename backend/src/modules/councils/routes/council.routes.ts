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

const CreateCouncilSchema = z.object({
  proposalId: z.string(),
  roundId: z.string().optional(),
  councilType: z.string(),
  establishmentDecisionNo: z.string().optional(),
  establishedAt: z.string().datetime().optional(),
  meetingDeadline: z.string().datetime().optional(),
  minMembersRequired: z.number().int().min(1).optional().default(3),
  maxMembersAllowed: z.number().int().min(1).optional().default(5),
});

// GET /api/councils/my-memberships
router.get('/my-memberships', authenticate, asyncHandler(async (req, res) => {
  const memberships = await CouncilMember.find({ userId: req.user!.sub, isDeleted: false })
    .populate({ path: 'councilId', populate: { path: 'proposalId', select: 'titleVI titleEN status' } });
  sendSuccess(res, memberships, 'My council memberships retrieved.');
}));

// POST /api/councils
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

// GET /api/councils/:councilId/members
router.get('/:councilId/members', authenticate, asyncHandler(async (req, res) => {
  const members = await CouncilMember.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('userId', 'fullName email department academicDegree');
  sendSuccess(res, members, 'Council members retrieved.');
}));

// POST /api/councils/:councilId/members
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

// GET /api/councils/:councilId/meetings
router.get('/:councilId/meetings', authenticate, asyncHandler(async (req, res) => {
  const meetings = await Meeting.find({ councilId: req.params.councilId, isDeleted: false }).sort({ scheduledAt: 1 });
  sendSuccess(res, meetings, 'Council meetings retrieved.');
}));

// POST /api/councils/:councilId/meetings
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

// GET /api/councils/:councilId/feedback
router.get('/:councilId/feedback', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const feedbacks = await ReviewerFeedback.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('reviewerId', 'fullName email');
  sendSuccess(res, feedbacks, 'Feedback retrieved.');
}));

// POST /api/councils/:councilId/feedback
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

// GET /api/councils/:councilId/acceptance
router.get('/:councilId/acceptance', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const reviews = await AcceptanceReview.find({ councilId: req.params.councilId, isDeleted: false })
    .populate('reviewerId', 'fullName email');
  sendSuccess(res, reviews, 'Acceptance reviews retrieved.');
}));

// POST /api/councils/:councilId/acceptance
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

export default router;
