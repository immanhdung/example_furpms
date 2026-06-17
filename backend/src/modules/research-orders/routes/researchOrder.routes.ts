import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { ResearchOrder } from '../models/researchOrder.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Research Orders
 *   description: Research order management
 */

const CreateSchema = z.object({
  cycleId: z.string().optional(),
  title: z.string().min(5),
  description: z.string().min(10),
  requiredBy: z.string().optional(),
  budget: z.number().positive().optional(),
});

/**
 * @swagger
 * /api/research-orders:
 *   get:
 *     summary: List research orders
 *     tags: [Research Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: cycleId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, MATCHED, CLOSED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Research orders retrieved
 *   post:
 *     summary: Create a research order
 *     tags: [Research Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               cycleId: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *               requiredBy: { type: string, format: date-time }
 *               budget: { type: number }
 *     responses:
 *       201:
 *         description: Research order created
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPaginationOptions(req);
  const filter: Record<string, unknown> = { isDeleted: false };
  if (req.query.cycleId) filter.cycleId = req.query.cycleId;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    ResearchOrder.find(filter)
      .populate('cycleId', 'name year')
      .populate('matchedProposalId', 'titleVI titleEN status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ResearchOrder.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Research orders retrieved.', data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, errors: null });
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const dto = CreateSchema.parse(req.body);
  const order = await new ResearchOrder({
    ...dto,
    cycleId: dto.cycleId ? new mongoose.Types.ObjectId(dto.cycleId) : undefined,
    requestedBy: new mongoose.Types.ObjectId(req.user!.sub),
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, order, 'Research order created.');
}));

/**
 * @swagger
 * /api/research-orders/{id}:
 *   get:
 *     summary: Get research order by ID
 *     tags: [Research Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Research order retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await ResearchOrder.findOne({ _id: req.params.id, isDeleted: false })
    .populate('cycleId', 'name year')
    .populate('matchedProposalId', 'titleVI titleEN status');
  if (!order) throw ApiError.notFound('Research order not found.');
  sendSuccess(res, order, 'Research order retrieved.');
}));

/**
 * @swagger
 * /api/research-orders/{id}/match:
 *   post:
 *     summary: Match a research order with a proposal
 *     tags: [Research Orders]
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
 *             required: [proposalId]
 *             properties:
 *               proposalId: { type: string }
 *     responses:
 *       200:
 *         description: Research order matched
 */
router.post('/:id/match', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { proposalId } = z.object({ proposalId: z.string() }).parse(req.body);
  const order = await ResearchOrder.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      matchedProposalId: new mongoose.Types.ObjectId(proposalId),
      status: 'MATCHED',
      updatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!order) throw ApiError.notFound('Research order not found.');
  sendSuccess(res, order, 'Research order matched with proposal.');
}));

export default router;
