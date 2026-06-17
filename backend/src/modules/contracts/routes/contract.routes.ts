import { Router } from 'express';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/rbac.middleware';
import { ROLES } from '../../../constants/roles';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { z } from 'zod';
import { Contract } from '../models/contract.model';
import { Disbursement } from '../../disbursements/models/disbursement.model';
import { Deliverable } from '../../deliverables/models/deliverable.model';
import { Amendment } from '../../amendments/models/amendment.model';
import { Proposal } from '../../proposals/models/proposal.model';
import { ApiError } from '../../../shared/apiError';
import mongoose from 'mongoose';
import { getPaginationOptions } from '../../../shared/pagination';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: Research contract management
 */

const CreateContractSchema = z.object({
  proposalId: z.string(),
  contractNumber: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxExtensionMonths: z.number().int().optional().default(6),
  sideARepresentative: z.string().optional(),
  econtractUrl: z.string().optional(),
});

const CreateAmendmentSchema = z.object({
  categoryId: z.string().optional(),
  changeDescription: z.string().min(5),
  justification: z.string().min(5),
  changePercentage: z.number().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  requiresRectorApproval: z.boolean().default(false),
  reviewerComments: z.string().optional(),
});

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: List contracts (own contracts for Faculty; all for Admin/Staff)
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Contracts retrieved
 *   post:
 *     summary: Create a contract from an approved proposal
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proposalId, contractNumber, startDate, endDate]
 *             properties:
 *               proposalId: { type: string }
 *               contractNumber: { type: string, example: HD-NCKH-2026-001 }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               maxExtensionMonths: { type: integer, default: 6 }
 *               sideARepresentative: { type: string }
 *               econtractUrl: { type: string }
 *     responses:
 *       201:
 *         description: Contract created
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { skip, limit, page } = getPaginationOptions(req);
  const isAdminOrStaff = req.user?.roles.some((r) => ['Admin', 'Staff'].includes(r));
  const filter: Record<string, unknown> = { isDeleted: false };

  if (!isAdminOrStaff) {
    const myProposals = await Proposal.find({ piId: req.user!.sub, isDeleted: false }).select('_id');
    filter.proposalId = { $in: myProposals.map((p) => p._id) };
  }

  const [items, total] = await Promise.all([
    Contract.find(filter)
      .populate({ path: 'proposalId', select: 'titleVI titleEN status piId', populate: { path: 'piId', select: 'fullName email' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Contract.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Contracts retrieved.', data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }, errors: null });
}));

router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const dto = CreateContractSchema.parse(req.body);
  const proposal = await Proposal.findById(dto.proposalId);
  if (!proposal) throw ApiError.notFound('Proposal not found.');

  const contract = await new Contract({
    ...dto,
    proposalId: new mongoose.Types.ObjectId(dto.proposalId),
    fundingMethod: proposal.fundingMethod,
    totalAmount: proposal.totalAmount,
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();

  await Proposal.findByIdAndUpdate(dto.proposalId, { status: 'APPROVED' });
  sendCreated(res, contract, 'Contract created.');
}));

/**
 * @swagger
 * /api/contracts/{id}:
 *   get:
 *     summary: Get contract by ID
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contract retrieved
 *       404:
 *         description: Contract not found
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const contract = await Contract.findOne({ _id: req.params.id, isDeleted: false })
    .populate({ path: 'proposalId', populate: { path: 'piId', select: 'fullName email department' } });
  if (!contract) throw ApiError.notFound('Contract not found.');
  sendSuccess(res, contract, 'Contract retrieved.');
}));

/**
 * @swagger
 * /api/contracts/{id}/sign:
 *   post:
 *     summary: Sign and activate a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contract signed and activated
 */
router.post('/:id/sign', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const contract = await Contract.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    {
      status: 'ACTIVE',
      signedAt: new Date(),
      signedBy: new mongoose.Types.ObjectId(req.user!.sub),
      updatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    },
    { new: true },
  );
  if (!contract) throw ApiError.notFound('Contract not found.');
  sendSuccess(res, contract, 'Contract signed.');
}));

/**
 * @swagger
 * /api/contracts/{contractId}/disbursements:
 *   get:
 *     summary: Get disbursement schedule for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Disbursements retrieved
 */
router.get('/:contractId/disbursements', authenticate, asyncHandler(async (req, res) => {
  const items = await Disbursement.find({ contractId: req.params.contractId, isDeleted: false }).sort({ installmentNumber: 1 });
  sendSuccess(res, items, 'Disbursements retrieved.');
}));

/**
 * @swagger
 * /api/contracts/{contractId}/disbursements/generate:
 *   post:
 *     summary: Generate disbursement schedule for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Disbursement schedule generated
 *       409:
 *         description: Schedule already generated
 */
router.post('/:contractId/disbursements/generate', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const contract = await Contract.findOne({ _id: req.params.contractId, isDeleted: false });
  if (!contract) throw ApiError.notFound('Contract not found.');

  const existing = await Disbursement.countDocuments({ contractId: contract._id, isDeleted: false });
  if (existing > 0) throw ApiError.conflict('Disbursement schedule already generated.');

  const deliverables = await Deliverable.find({ contractId: contract._id, isDeleted: false }).sort({ sequence: 1 });
  const disbursements: object[] = [];

  if (contract.fundingMethod === 'PARTIAL' && deliverables.length > 0) {
    const perDeliverable = Math.floor(contract.totalAmount / deliverables.length);
    for (let i = 0; i < deliverables.length; i++) {
      disbursements.push({
        contractId: contract._id,
        installmentNumber: i + 1,
        plannedAmount: i === deliverables.length - 1
          ? contract.totalAmount - perDeliverable * i
          : perDeliverable,
        plannedDate: deliverables[i].dueDate,
        deliverableId: deliverables[i]._id,
        createdBy: new mongoose.Types.ObjectId(req.user!.sub),
      });
    }
  } else {
    const installments = [
      { pct: 0.3, months: 0 },
      { pct: 0.4, months: Math.floor(contract.maxExtensionMonths / 2) },
      { pct: 0.3, months: contract.maxExtensionMonths },
    ];
    for (let i = 0; i < installments.length; i++) {
      const d = new Date(contract.startDate);
      d.setMonth(d.getMonth() + installments[i].months);
      disbursements.push({
        contractId: contract._id,
        installmentNumber: i + 1,
        plannedAmount: Math.floor(contract.totalAmount * installments[i].pct),
        plannedDate: d,
        createdBy: new mongoose.Types.ObjectId(req.user!.sub),
      });
    }
  }

  const created = await Disbursement.insertMany(disbursements);
  sendCreated(res, created, 'Disbursement schedule generated.');
}));

/**
 * @swagger
 * /api/contracts/{contractId}/deliverables:
 *   get:
 *     summary: Get deliverables for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deliverables retrieved
 */
router.get('/:contractId/deliverables', authenticate, asyncHandler(async (req, res) => {
  const items = await Deliverable.find({ contractId: req.params.contractId, isDeleted: false }).sort({ sequence: 1 });
  sendSuccess(res, items, 'Deliverables retrieved.');
}));

/**
 * @swagger
 * /api/contracts/{contractId}/amendments:
 *   get:
 *     summary: Get amendments for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Amendments retrieved
 *   post:
 *     summary: Create amendment request for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [changeDescription, justification]
 *             properties:
 *               categoryId: { type: string }
 *               changeDescription: { type: string }
 *               justification: { type: string }
 *               changePercentage: { type: number }
 *               oldValue: { type: string }
 *               newValue: { type: string }
 *               requiresRectorApproval: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Amendment request created
 */
router.get('/:contractId/amendments', authenticate, asyncHandler(async (req, res) => {
  const items = await Amendment.find({ contractId: req.params.contractId, isDeleted: false }).sort({ createdAt: -1 });
  sendSuccess(res, items, 'Amendments retrieved.');
}));

router.post('/:contractId/amendments', authenticate, asyncHandler(async (req, res) => {
  const dto = CreateAmendmentSchema.parse(req.body);
  const amendment = await new Amendment({
    ...dto,
    contractId: new mongoose.Types.ObjectId(req.params.contractId),
    categoryId: dto.categoryId ? new mongoose.Types.ObjectId(dto.categoryId) : undefined,
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, amendment, 'Amendment request created.');
}));

/**
 * @swagger
 * /api/contracts/{contractId}/settlement:
 *   get:
 *     summary: Get settlement for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Settlement retrieved
 *   post:
 *     summary: Create settlement for a contract
 *     tags: [Contracts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totalDisbursed, totalExpense, surplus]
 *             properties:
 *               totalDisbursed: { type: number }
 *               totalExpense: { type: number }
 *               surplus: { type: number }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Settlement created
 *       409:
 *         description: Settlement already exists
 */
router.get('/:contractId/settlement', authenticate, asyncHandler(async (req, res) => {
  const { Settlement } = await import('../../settlements/models/settlement.model');
  const settlement = await Settlement.findOne({ contractId: req.params.contractId, isDeleted: false });
  sendSuccess(res, settlement, 'Settlement retrieved.');
}));

router.post('/:contractId/settlement', authenticate, authorize(ROLES.ADMIN, ROLES.STAFF), asyncHandler(async (req, res) => {
  const { Settlement } = await import('../../settlements/models/settlement.model');
  const schema = z.object({
    totalDisbursed: z.number(),
    totalExpense: z.number(),
    surplus: z.number(),
    notes: z.string().optional(),
  });
  const dto = schema.parse(req.body);
  const existing = await Settlement.findOne({ contractId: req.params.contractId, isDeleted: false });
  if (existing) throw ApiError.conflict('Settlement already exists for this contract.');

  const settlement = await new Settlement({
    ...dto,
    contractId: new mongoose.Types.ObjectId(req.params.contractId),
    createdBy: new mongoose.Types.ObjectId(req.user!.sub),
  }).save();
  sendCreated(res, settlement, 'Settlement created.');
}));

export default router;
