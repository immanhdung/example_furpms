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

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const contract = await Contract.findOne({ _id: req.params.id, isDeleted: false })
    .populate({ path: 'proposalId', populate: { path: 'piId', select: 'fullName email department' } });
  if (!contract) throw ApiError.notFound('Contract not found.');
  sendSuccess(res, contract, 'Contract retrieved.');
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

// Disbursements
router.get('/:contractId/disbursements', authenticate, asyncHandler(async (req, res) => {
  const items = await Disbursement.find({ contractId: req.params.contractId, isDeleted: false }).sort({ installmentNumber: 1 });
  sendSuccess(res, items, 'Disbursements retrieved.');
}));

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
    // WHOLE: 3 installments (30% / 40% / 30%)
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

// Deliverables
router.get('/:contractId/deliverables', authenticate, asyncHandler(async (req, res) => {
  const items = await Deliverable.find({ contractId: req.params.contractId, isDeleted: false }).sort({ sequence: 1 });
  sendSuccess(res, items, 'Deliverables retrieved.');
}));

// Amendments
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

// Settlement sub-routes
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
