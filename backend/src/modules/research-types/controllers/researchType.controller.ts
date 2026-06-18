import { Request, Response } from 'express';
import { researchTypeService } from '../services/researchType.service';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { RESEARCH_TYPE_MESSAGES } from '../../../constants/messages';
import { CreateResearchTypeSchema, UpdateResearchTypeSchema } from '../dto/researchType.dto';

export const listResearchTypes = asyncHandler(async (_req: Request, res: Response) => {
  const items = await researchTypeService.listResearchTypes();
  sendSuccess(res, items, RESEARCH_TYPE_MESSAGES.LIST_FETCHED);
});

export const getResearchType = asyncHandler(async (req: Request, res: Response) => {
  const rt = await researchTypeService.getResearchTypeById(req.params.id);
  sendSuccess(res, rt, RESEARCH_TYPE_MESSAGES.FETCHED);
});

export const createResearchType = asyncHandler(async (req: Request, res: Response) => {
  const dto = CreateResearchTypeSchema.parse(req.body);
  const rt = await researchTypeService.createResearchType(dto, req.user?.sub);
  sendCreated(res, rt, RESEARCH_TYPE_MESSAGES.CREATED);
});

export const updateResearchType = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateResearchTypeSchema.parse(req.body);
  const rt = await researchTypeService.updateResearchType(req.params.id, dto, req.user?.sub);
  sendSuccess(res, rt, RESEARCH_TYPE_MESSAGES.UPDATED);
});

export const deleteResearchType = asyncHandler(async (req: Request, res: Response) => {
  await researchTypeService.deleteResearchType(req.params.id, req.user?.sub);
  sendSuccess(res, null, 'Research type deleted successfully.');
});
