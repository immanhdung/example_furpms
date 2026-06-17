import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authRepository } from '../repositories/auth.repository';
import { LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { ApiError } from '../../../shared/apiError';
import { jwtConfig } from '../../../configs/jwt';
import { AUTH_MESSAGES } from '../../../constants/messages';
import { JwtPayload } from '../../../middlewares/auth.middleware';
import { Role } from '../../../constants/roles';

export class AuthService {
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.accessSecret, {
      expiresIn: jwtConfig.accessExpiresIn,
    });
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async login(dto: LoginDto) {
    const user = await authRepository.findUserByEmail(dto.email);
    if (!user) throw ApiError.unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);

    if (user.status === 'INACTIVE') {
      throw ApiError.unauthorized('Your account has been deactivated.');
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) throw ApiError.unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);

    await authRepository.updateLastLogin(user._id.toString());

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles as Role[],
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshTokenStr = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + jwtConfig.refreshExpiresIn * 1000);
    await authRepository.saveRefreshToken(user._id.toString(), refreshTokenStr, expiresAt);

    return {
      accessToken,
      refreshToken: refreshTokenStr,
      tokenType: 'Bearer',
      expiresIn: jwtConfig.accessExpiresIn,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        roles: user.roles,
        lastLoginAt: new Date(),
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const token = await authRepository.findRefreshToken(refreshToken);
    if (!token || token.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const { User } = await import('../../users/models/user.model');
    const user = await User.findById(token.userId);
    if (!user || user.isDeleted || user.status === 'INACTIVE') {
      throw ApiError.unauthorized('User not found or inactive.');
    }

    await authRepository.revokeRefreshToken(refreshToken);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles as Role[],
    };

    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + jwtConfig.refreshExpiresIn * 1000);
    await authRepository.saveRefreshToken(user._id.toString(), newRefreshToken, expiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtConfig.accessExpiresIn,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const { User } = await import('../../users/models/user.model');
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw ApiError.notFound('User not found.');

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) throw ApiError.badRequest(AUTH_MESSAGES.WRONG_CURRENT_PASSWORD);

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const newHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await authRepository.updatePassword(userId, newHash);
    await authRepository.revokeAllUserTokens(userId);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
    }
  }
}

export const authService = new AuthService();
