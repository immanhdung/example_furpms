import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, UpdateAcademicProfileDto } from '../dto/user.dto';
import { ApiError } from '../../../shared/apiError';
import { ROLE_IDS } from '../../../constants/roles';
import { USER_MESSAGES } from '../../../constants/messages';
import { getPaginationOptions } from '../../../shared/pagination';
import { Request } from 'express';

export class UserService {
  async listUsers(req: Request) {
    const { page, limit, skip } = getPaginationOptions(req);
    const filter: Record<string, unknown> = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.roles = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      userRepository.findAll(filter, skip, limit),
      userRepository.count(filter),
    ]);

    return { items: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound(USER_MESSAGES.NOT_FOUND);
    return user;
  }

  async createUser(dto: CreateUserDto, createdBy?: string) {
    const exists = await userRepository.existsByEmail(dto.email);
    if (exists) throw ApiError.conflict(USER_MESSAGES.EMAIL_EXISTS);

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(dto.temporaryPassword, saltRounds);

    const roles = dto.roles.map((id) => ROLE_IDS[id]).filter(Boolean);
    if (!roles.length) throw ApiError.badRequest('Invalid role IDs provided.');

    const user = await userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      department: dto.department,
      academicDegree: dto.academicDegree,
      roles,
      createdBy: createdBy ? (createdBy as unknown as import('mongoose').Types.ObjectId) : undefined,
    });

    const { passwordHash: _p, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async updateUser(id: string, dto: UpdateUserDto, updatedBy?: string) {
    const existing = await userRepository.findById(id);
    if (!existing) throw ApiError.notFound(USER_MESSAGES.NOT_FOUND);

    const updateData: Record<string, unknown> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.academicDegree !== undefined) updateData.academicDegree = dto.academicDegree;
    if (dto.status) updateData.status = dto.status;
    if (dto.roles) {
      const roles = dto.roles.map((rid) => ROLE_IDS[rid]).filter(Boolean);
      if (!roles.length) throw ApiError.badRequest('Invalid role IDs provided.');
      updateData.roles = roles;
    }

    const updated = await userRepository.update(id, updateData, updatedBy);
    if (!updated) throw ApiError.notFound(USER_MESSAGES.NOT_FOUND);
    return updated;
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound(USER_MESSAGES.NOT_FOUND);
    const profile = await userRepository.findProfile(userId);
    return { user, profile };
  }

  async upsertProfile(userId: string, dto: UpdateAcademicProfileDto, updatedBy?: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound(USER_MESSAGES.NOT_FOUND);
    return userRepository.upsertProfile(userId, dto, updatedBy);
  }
}

export const userService = new UserService();
