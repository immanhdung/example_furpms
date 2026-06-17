import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { AUTH_MESSAGES } from '../../../constants/messages';
import { LoginSchema, ChangePasswordSchema, RefreshTokenSchema } from '../dto/auth.dto';
import { userRepository } from '../../users/repositories/user.repository';
import { ApiError } from '../../../shared/apiError';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@furpms.edu.vn }
 *               password: { type: string, example: Admin@123456 }
 *     responses:
 *       200:
 *         description: Login successful
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const dto = LoginSchema.parse(req.body);
  const result = await authService.login(dto);
  sendSuccess(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await userRepository.findById(req.user.sub);
  if (!user) throw ApiError.notFound('User not found.');
  sendSuccess(res, user, 'User retrieved successfully.');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const dto = ChangePasswordSchema.parse(req.body);
  await authService.changePassword(req.user.sub, dto);
  sendSuccess(res, null, AUTH_MESSAGES.PASSWORD_CHANGED);
});

export const refreshTokens = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = RefreshTokenSchema.parse(req.body);
  const result = await authService.refreshTokens(refreshToken);
  sendSuccess(res, result, 'Token refreshed.');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken as string | undefined;
  await authService.logout(refreshToken);
  sendSuccess(res, null, AUTH_MESSAGES.LOGOUT_SUCCESS);
});
