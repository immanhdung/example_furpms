import { proposalRepository } from '../repositories/proposal.repository';
import {
  CreateProposalDto,
  UpdateProposalDto,
  CreateResearchContentDto,
  CreateActivityDto,
  CreateExpectedProductDto,
  AddMemberDto,
  UpdateBudgetDto,
  UpdateLaborDetailDto,
} from '../dto/proposal.dto';
import { ApiError } from '../../../shared/apiError';
import { PROPOSAL_MESSAGES } from '../../../constants/messages';
import { PROPOSAL_STATUS } from '../../../constants/status';
import { getPaginationOptions } from '../../../shared/pagination';
import { Request } from 'express';
import { Proposal } from '../models/proposal.model';
import mongoose from 'mongoose';

export class ProposalService {
  async listProposals(req: Request) {
    const { page, limit, skip } = getPaginationOptions(req);
    const isAdminOrStaff = req.user?.roles.some((r) => ['Admin', 'Staff'].includes(r));

    const filter: Record<string, unknown> = {};
    if (!isAdminOrStaff && req.user) filter.piId = req.user.sub;
    if (req.query.trackId) filter.trackId = req.query.trackId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.researchType) filter.researchType = parseInt(req.query.researchType as string, 10);
    if (req.query.search) {
      filter.$or = [
        { titleVI: { $regex: req.query.search, $options: 'i' } },
        { titleEN: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      proposalRepository.findAll(filter, skip, limit),
      proposalRepository.count(filter),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMyProposals(req: Request) {
    if (!req.user) throw ApiError.unauthorized();
    const proposals = await proposalRepository.findByPiId(req.user.sub);
    return proposals;
  }

  async getProposalById(id: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    return proposal;
  }

  async createProposal(dto: CreateProposalDto, piId: string) {
    const totalAmount = dto.budgetItems?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

    const budgetItems = (dto.budgetItems ?? []).map((item, i) => ({
      categoryId: item.categoryId ? new mongoose.Types.ObjectId(item.categoryId) : undefined,
      categoryCode: item.categoryId ? '' : 'OTHER',
      categoryName: item.category || item.categoryName || 'Chi khác',
      amount: item.amount,
      sourceKhoan: item.sourceKhoan ?? item.amount,
      sourceNgoaiKhoan: item.sourceNgoaiKhoan ?? 0,
      sourceNsnn: item.sourceNsnn ?? item.amount,
      sourceOther: item.sourceOther ?? 0,
      sequence: item.sequence ?? i + 1,
      note: item.note,
    }));

    return proposalRepository.create({
      trackId: new mongoose.Types.ObjectId(dto.trackId),
      piId: new mongoose.Types.ObjectId(piId),
      titleVI: dto.titleVI,
      titleEN: dto.titleEN,
      researchType: dto.researchType,
      fundingMethod: dto.fundingMethod,
      durationMonths: dto.durationMonths,
      objectives: dto.objectives,
      methodology: dto.methodology,
      expectedOutput: dto.expectedOutput,
      status: PROPOSAL_STATUS.DRAFT,
      totalAmount,
      members: dto.members ?? [],
      budgetItems,
      createdBy: new mongoose.Types.ObjectId(piId),
    });
  }

  async updateProposal(id: string, dto: UpdateProposalDto, userId: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    if (proposal.piId.toString() !== userId) throw ApiError.forbidden(PROPOSAL_MESSAGES.NOT_OWNER);
    if (proposal.status !== PROPOSAL_STATUS.DRAFT) throw ApiError.conflict(PROPOSAL_MESSAGES.CANNOT_EDIT);

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.budgetItems) {
      updateData.totalAmount = dto.budgetItems.reduce((sum, item) => sum + item.amount, 0);
    }
    return proposalRepository.update(id, updateData, userId);
  }

  async submitProposal(id: string, userId: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    if (proposal.piId.toString() !== userId) throw ApiError.forbidden(PROPOSAL_MESSAGES.NOT_OWNER);
    if (proposal.status !== PROPOSAL_STATUS.DRAFT) throw ApiError.conflict(PROPOSAL_MESSAGES.CANNOT_SUBMIT);

    return proposalRepository.updateStatus(id, PROPOSAL_STATUS.SUBMITTED, { submittedAt: new Date() }, userId);
  }

  async withdrawProposal(id: string, userId: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    if (proposal.piId.toString() !== userId) throw ApiError.forbidden(PROPOSAL_MESSAGES.NOT_OWNER);
    if (proposal.status !== PROPOSAL_STATUS.SUBMITTED) throw ApiError.conflict(PROPOSAL_MESSAGES.CANNOT_WITHDRAW);

    return proposalRepository.updateStatus(id, PROPOSAL_STATUS.DRAFT, { withdrawnAt: new Date() }, userId);
  }

  // Budget operations
  async getBudget(id: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    return {
      totalAmount: proposal.totalAmount,
      items: proposal.budgetItems,
    };
  }

  async updateBudget(id: string, dto: UpdateBudgetDto, userId: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    const computedTotal = dto.items.reduce((sum, i) => sum + i.amount, 0);
    if (Math.abs(computedTotal - dto.totalAmount) > 1) {
      throw ApiError.badRequest('Sum of items.amount must equal totalAmount.');
    }

    return proposalRepository.update(id, {
      totalAmount: dto.totalAmount,
      budgetItems: dto.items as unknown as import('../models/proposal.model').IProposalBudgetItem[],
    }, userId);
  }

  async getLaborDetails(id: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    return proposal.laborDetails;
  }

  async updateLaborDetail(proposalId: string, detailId: string, dto: UpdateLaborDetailDto, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    const detail = proposal.laborDetails.find((d) => d._id?.toString() === detailId);
    if (!detail) throw ApiError.notFound('Labor detail not found.');

    Object.assign(detail, dto);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return detail;
  }

  // Team members
  async getTeamMembers(id: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    return proposal.members;
  }

  async addTeamMember(id: string, dto: AddMemberDto, userId: string) {
    const proposal = await Proposal.findOne({ _id: id, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    proposal.members.push(dto as unknown as import('../models/proposal.model').IProposalMember);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return proposal.members;
  }

  // Research contents
  async getResearchContents(id: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    return proposal.researchContents;
  }

  async addResearchContent(id: string, dto: CreateResearchContentDto, userId: string) {
    const proposal = await Proposal.findOne({ _id: id, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    proposal.researchContents.push({ ...dto, activities: [] } as unknown as import('../models/proposal.model').IResearchContent);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return proposal.researchContents;
  }

  async updateResearchContent(proposalId: string, contentId: string, dto: Partial<CreateResearchContentDto>, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    const content = proposal.researchContents.find((c) => c._id?.toString() === contentId);
    if (!content) throw ApiError.notFound('Research content not found.');

    Object.assign(content, dto);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return content;
  }

  async deleteResearchContent(proposalId: string, contentId: string, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    proposal.researchContents = proposal.researchContents.filter(
      (c) => c._id?.toString() !== contentId,
    ) as typeof proposal.researchContents;
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
  }

  async addActivity(proposalId: string, contentId: string, dto: CreateActivityDto, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    const content = proposal.researchContents.find((c) => c._id?.toString() === contentId);
    if (!content) throw ApiError.notFound('Research content not found.');

    content.activities.push(dto as unknown as import('../models/proposal.model').IActivity);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return content;
  }

  async updateActivity(proposalId: string, activityId: string, dto: Partial<CreateActivityDto>, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    for (const content of proposal.researchContents) {
      const activity = content.activities.find((a) => a._id?.toString() === activityId);
      if (activity) {
        Object.assign(activity, dto);
        proposal.updatedBy = new mongoose.Types.ObjectId(userId);
        await proposal.save();
        return activity;
      }
    }
    throw ApiError.notFound('Activity not found.');
  }

  async deleteActivity(proposalId: string, activityId: string, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    let deleted = false;
    for (const content of proposal.researchContents) {
      const before = content.activities.length;
      content.activities = content.activities.filter(
        (a) => a._id?.toString() !== activityId,
      ) as typeof content.activities;
      if (content.activities.length < before) { deleted = true; break; }
    }

    if (!deleted) throw ApiError.notFound('Activity not found.');
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
  }

  // Expected products
  async getExpectedProducts(id: string) {
    const proposal = await proposalRepository.findById(id);
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);
    return proposal.expectedProducts;
  }

  async addExpectedProduct(id: string, dto: CreateExpectedProductDto, userId: string) {
    const proposal = await Proposal.findOne({ _id: id, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    proposal.expectedProducts.push(dto as unknown as import('../models/proposal.model').IExpectedProduct);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return proposal.expectedProducts;
  }

  async updateExpectedProduct(proposalId: string, productId: string, dto: Partial<CreateExpectedProductDto>, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    const product = proposal.expectedProducts.find((p) => p._id?.toString() === productId);
    if (!product) throw ApiError.notFound('Expected product not found.');

    Object.assign(product, dto);
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
    return product;
  }

  async deleteExpectedProduct(proposalId: string, productId: string, userId: string) {
    const proposal = await Proposal.findOne({ _id: proposalId, isDeleted: false });
    if (!proposal) throw ApiError.notFound(PROPOSAL_MESSAGES.NOT_FOUND);

    proposal.expectedProducts = proposal.expectedProducts.filter(
      (p) => p._id?.toString() !== productId,
    ) as typeof proposal.expectedProducts;
    proposal.updatedBy = new mongoose.Types.ObjectId(userId);
    await proposal.save();
  }
}

export const proposalService = new ProposalService();
