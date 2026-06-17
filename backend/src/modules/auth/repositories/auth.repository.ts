import { RefreshToken, IRefreshToken } from '../models/refreshToken.model';
import { User, IUser } from '../../users/models/user.model';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+passwordHash');
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<IRefreshToken> {
    const refreshToken = new RefreshToken({ userId, token, expiresAt });
    return refreshToken.save();
  }

  async findRefreshToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token, isRevoked: false });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { passwordHash });
  }
}

export const authRepository = new AuthRepository();
