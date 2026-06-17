import { Cycle, ICycle } from '../models/cycle.model';

export class CycleRepository {
  async findAll(skip = 0, limit = 20, filter: Record<string, unknown> = {}): Promise<ICycle[]> {
    return Cycle.find({ ...filter, isDeleted: false })
      .sort({ year: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as ICycle[];
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return Cycle.countDocuments({ ...filter, isDeleted: false });
  }

  async findById(id: string): Promise<ICycle | null> {
    return Cycle.findOne({ _id: id, isDeleted: false }).lean() as unknown as ICycle | null;
  }

  async create(data: Partial<ICycle>): Promise<ICycle> {
    return new Cycle(data).save();
  }

  async update(id: string, data: Partial<ICycle>, updatedBy?: string): Promise<ICycle | null> {
    return Cycle.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, updatedBy },
      { new: true, runValidators: true },
    );
  }

  async updateStatus(id: string, status: string, updatedBy?: string): Promise<ICycle | null> {
    return Cycle.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status, updatedBy },
      { new: true },
    );
  }
}

export const cycleRepository = new CycleRepository();
