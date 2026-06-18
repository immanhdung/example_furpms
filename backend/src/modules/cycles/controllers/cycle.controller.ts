import { Request, Response } from 'express';
import { cycleService } from '../services/cycle.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { CYCLE_MESSAGES } from '../../../constants/messages';
import { AdminCreateCycleSchema, StaffConfigureCycleSchema, UpdateCycleSchema } from '../dto/cycle.dto';

export const listCycles = asyncHandler(async (req: Request, res: Response) => {
  const result = await cycleService.listCycles(req);
  sendPaginated(res, result.items, result.total, result.page, result.limit, CYCLE_MESSAGES.LIST_FETCHED);
});

export const getCycle = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await cycleService.getCycleById(req.params.id);
  sendSuccess(res, cycle, CYCLE_MESSAGES.FETCHED);
});

export const createCycle = asyncHandler(async (req: Request, res: Response) => {
  const dto = AdminCreateCycleSchema.parse(req.body);
  const cycle = await cycleService.createCycle(dto, req.user?.sub);
  sendCreated(res, cycle, CYCLE_MESSAGES.CREATED);
});

export const configureCycle = asyncHandler(async (req: Request, res: Response) => {
  const dto = StaffConfigureCycleSchema.parse(req.body);
  const cycle = await cycleService.configureCycle(req.params.id, dto, req.user?.sub);
  sendSuccess(res, cycle, CYCLE_MESSAGES.CONFIGURED);
});

export const updateCycle = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateCycleSchema.parse(req.body);
  const cycle = await cycleService.updateCycle(req.params.id, dto, req.user?.sub);
  sendSuccess(res, cycle, CYCLE_MESSAGES.UPDATED);
});

export const openCycle = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await cycleService.openCycle(req.params.id, req.user?.sub);
  sendSuccess(res, cycle, CYCLE_MESSAGES.OPENED);
});

export const closeCycle = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await cycleService.closeCycle(req.params.id, req.user?.sub);
  sendSuccess(res, cycle, CYCLE_MESSAGES.CLOSED);
});
