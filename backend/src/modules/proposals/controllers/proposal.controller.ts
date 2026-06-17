import { Request, Response } from 'express';
import { proposalService } from '../services/proposal.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { PROPOSAL_MESSAGES } from '../../../constants/messages';
import { ApiError } from '../../../shared/apiError';
import {
  CreateProposalSchema,
  UpdateProposalSchema,
  CreateResearchContentSchema,
  UpdateResearchContentSchema,
  CreateActivitySchema,
  UpdateActivitySchema,
  CreateExpectedProductSchema,
  UpdateExpectedProductSchema,
  AddMemberSchema,
  UpdateBudgetSchema,
  UpdateLaborDetailSchema,
} from '../dto/proposal.dto';

export const listProposals = asyncHandler(async (req: Request, res: Response) => {
  const result = await proposalService.listProposals(req);
  sendPaginated(res, result.items, result.total, result.page, result.limit, PROPOSAL_MESSAGES.LIST_FETCHED);
});

export const getMyProposals = asyncHandler(async (req: Request, res: Response) => {
  const proposals = await proposalService.getMyProposals(req);
  sendSuccess(res, proposals, PROPOSAL_MESSAGES.LIST_FETCHED);
});

export const getProposal = asyncHandler(async (req: Request, res: Response) => {
  const proposal = await proposalService.getProposalById(req.params.id);
  sendSuccess(res, proposal, PROPOSAL_MESSAGES.FETCHED);
});

export const createProposal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = CreateProposalSchema.parse(req.body);
  const proposal = await proposalService.createProposal(dto, req.user.sub);
  sendCreated(res, proposal, PROPOSAL_MESSAGES.CREATED);
});

export const updateProposal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = UpdateProposalSchema.parse(req.body);
  const proposal = await proposalService.updateProposal(req.params.id, dto, req.user.sub);
  sendSuccess(res, proposal, PROPOSAL_MESSAGES.UPDATED);
});

export const submitProposal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const proposal = await proposalService.submitProposal(req.params.id, req.user.sub);
  sendSuccess(res, proposal, PROPOSAL_MESSAGES.SUBMITTED);
});

export const withdrawProposal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const proposal = await proposalService.withdrawProposal(req.params.id, req.user.sub);
  sendSuccess(res, proposal, PROPOSAL_MESSAGES.WITHDRAWN);
});

// Budget
export const getBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await proposalService.getBudget(req.params.id);
  sendSuccess(res, budget, 'Budget retrieved.');
});

export const updateBudget = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = UpdateBudgetSchema.parse(req.body);
  const result = await proposalService.updateBudget(req.params.id, dto, req.user.sub);
  sendSuccess(res, result, 'Budget updated.');
});

export const getLaborDetails = asyncHandler(async (req: Request, res: Response) => {
  const details = await proposalService.getLaborDetails(req.params.id);
  sendSuccess(res, details, 'Labor details retrieved.');
});

export const updateLaborDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = UpdateLaborDetailSchema.parse(req.body);
  const result = await proposalService.updateLaborDetail(req.params.id, req.params.detailId, dto, req.user.sub);
  sendSuccess(res, result, 'Labor detail updated.');
});

// Team members
export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await proposalService.getTeamMembers(req.params.id);
  sendSuccess(res, members, 'Team members retrieved.');
});

export const addTeamMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = AddMemberSchema.parse(req.body);
  const members = await proposalService.addTeamMember(req.params.id, dto, req.user.sub);
  sendCreated(res, members, 'Team member added.');
});

// Research contents
export const getResearchContents = asyncHandler(async (req: Request, res: Response) => {
  const contents = await proposalService.getResearchContents(req.params.id);
  sendSuccess(res, contents, 'Research contents retrieved.');
});

export const addResearchContent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = CreateResearchContentSchema.parse(req.body);
  const contents = await proposalService.addResearchContent(req.params.id, dto, req.user.sub);
  sendCreated(res, contents, 'Research content added.');
});

export const updateResearchContent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = UpdateResearchContentSchema.parse(req.body);
  const content = await proposalService.updateResearchContent(req.params.id, req.params.contentId, dto, req.user.sub);
  sendSuccess(res, content, 'Research content updated.');
});

export const deleteResearchContent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await proposalService.deleteResearchContent(req.params.id, req.params.contentId, req.user.sub);
  sendSuccess(res, null, 'Research content deleted.');
});

// Activities
export const addActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = CreateActivitySchema.parse(req.body);
  const content = await proposalService.addActivity(req.params.id, req.params.contentId, dto, req.user.sub);
  sendCreated(res, content, 'Activity added.');
});

export const updateActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = UpdateActivitySchema.parse(req.body);
  const activity = await proposalService.updateActivity(req.params.id, req.params.activityId, dto, req.user.sub);
  sendSuccess(res, activity, 'Activity updated.');
});

export const deleteActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await proposalService.deleteActivity(req.params.id, req.params.activityId, req.user.sub);
  sendSuccess(res, null, 'Activity deleted.');
});

// Expected products
export const getExpectedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await proposalService.getExpectedProducts(req.params.id);
  sendSuccess(res, products, 'Expected products retrieved.');
});

export const addExpectedProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = CreateExpectedProductSchema.parse(req.body);
  const products = await proposalService.addExpectedProduct(req.params.id, dto, req.user.sub);
  sendCreated(res, products, 'Expected product added.');
});

export const updateExpectedProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = UpdateExpectedProductSchema.parse(req.body);
  const product = await proposalService.updateExpectedProduct(req.params.id, req.params.productId, dto, req.user.sub);
  sendSuccess(res, product, 'Expected product updated.');
});

export const deleteExpectedProduct = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await proposalService.deleteExpectedProduct(req.params.id, req.params.productId, req.user.sub);
  sendSuccess(res, null, 'Expected product deleted.');
});
