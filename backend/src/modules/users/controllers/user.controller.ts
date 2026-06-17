import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { USER_MESSAGES } from '../../../constants/messages';
import { CreateUserSchema, UpdateUserSchema, UpdateAcademicProfileSchema } from '../dto/user.dto';
import { ApiError } from '../../../shared/apiError';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req);
  sendPaginated(res, result.items, result.total, result.page, result.limit, USER_MESSAGES.LIST_FETCHED);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, user, USER_MESSAGES.FETCHED);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const dto = CreateUserSchema.parse(req.body);
  const user = await userService.createUser(dto, req.user?.sub);
  sendCreated(res, user, USER_MESSAGES.CREATED);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const dto = UpdateUserSchema.parse(req.body);
  const user = await userService.updateUser(req.params.id, dto, req.user?.sub);
  sendSuccess(res, user, USER_MESSAGES.UPDATED);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  // Authorization: owner, Admin, or Staff
  if (
    req.user?.sub !== userId &&
    !req.user?.roles.some((r) => ['Admin', 'Staff'].includes(r))
  ) {
    throw ApiError.forbidden();
  }
  const profile = await userService.getProfile(userId);
  sendSuccess(res, profile, USER_MESSAGES.PROFILE_FETCHED);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (
    req.user?.sub !== userId &&
    !req.user?.roles.some((r) => ['Admin', 'Staff'].includes(r))
  ) {
    throw ApiError.forbidden();
  }
  const dto = UpdateAcademicProfileSchema.parse(req.body);
  const profile = await userService.upsertProfile(userId, dto, req.user?.sub);
  sendSuccess(res, profile, USER_MESSAGES.PROFILE_UPDATED);
});
