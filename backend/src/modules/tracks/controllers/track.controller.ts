import { Request, Response } from 'express';
import { trackService } from '../services/track.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { TRACK_MESSAGES } from '../../../constants/messages';
import { CreateTrackSchema, UpdateTrackSchema, AssignOwnerSchema } from '../dto/track.dto';

export const listTracks = asyncHandler(async (req: Request, res: Response) => {
  const result = await trackService.listTracks(req);
  sendPaginated(res, result.items, result.total, result.page, result.limit, TRACK_MESSAGES.LIST_FETCHED);
});

export const getTrack = asyncHandler(async (req: Request, res: Response) => {
  const track = await trackService.getTrackById(req.params.id);
  sendSuccess(res, track, TRACK_MESSAGES.FETCHED);
});

export const createTrack = asyncHandler(async (req: Request, res: Response) => {
  const dto = CreateTrackSchema.parse(req.body);
  const track = await trackService.createTrack(dto, req.user?.sub);
  sendCreated(res, track, TRACK_MESSAGES.CREATED);
});

export const updateTrack = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateTrackSchema.parse(req.body);
  const track = await trackService.updateTrack(req.params.id, dto, req.user?.sub);
  sendSuccess(res, track, TRACK_MESSAGES.UPDATED);
});

export const assignOwner = asyncHandler(async (req: Request, res: Response) => {
  const dto = AssignOwnerSchema.parse(req.body);
  const track = await trackService.assignOwner(req.params.id, dto, req.user?.sub);
  sendSuccess(res, track, TRACK_MESSAGES.OWNER_ASSIGNED);
});

export const deactivateTrack = asyncHandler(async (req: Request, res: Response) => {
  const track = await trackService.deactivate(req.params.id, req.user?.sub);
  sendSuccess(res, track, TRACK_MESSAGES.DEACTIVATED);
});
