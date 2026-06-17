import mongoose from 'mongoose';
import { User, IUser } from '../models/user.model';
import { AcademicProfile, IAcademicProfile } from '../models/academicProfile.model';

export class UserRepository {
  async findAll(filter: Record<string, unknown> = {}, skip = 0, limit = 20): Promise<IUser[]> {
    return User.find({ ...filter, isDeleted: false })
      .select('-passwordHash')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean() as unknown as IUser[];
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return User.countDocuments({ ...filter, isDeleted: false });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false }).select('-passwordHash').lean() as unknown as IUser | null;
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false }).select('+passwordHash');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+passwordHash');
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async update(
    id: string,
    data: Partial<IUser>,
    updatedBy?: string,
  ): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, updatedBy },
      { new: true, runValidators: true },
    ).select('-passwordHash');
  }

  async softDelete(id: string, deletedBy?: string): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), deletedBy },
      { new: true },
    );
  }

  async findProfile(userId: string): Promise<IAcademicProfile | null> {
    return AcademicProfile.findOne({ userId, isDeleted: false }).lean() as unknown as IAcademicProfile | null;
  }

  async upsertProfile(
    userId: string,
    data: Partial<IAcademicProfile>,
    updatedBy?: string,
  ): Promise<IAcademicProfile> {
    return AcademicProfile.findOneAndUpdate(
      { userId },
      { ...data, userId, updatedBy },
      { new: true, upsert: true, runValidators: true },
    );
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, unknown> = { email: email.toLowerCase(), isDeleted: false };
    if (excludeId) query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    const count = await User.countDocuments(query);
    return count > 0;
  }
}

export const userRepository = new UserRepository();
