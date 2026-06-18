import { ResearchType, IResearchType } from '../models/researchType.model';

export class ResearchTypeRepository {
  async findAll(): Promise<IResearchType[]> {
    return ResearchType.find({ isDeleted: false, isActive: true }).sort({ name: 1 }).lean() as unknown as IResearchType[];
  }

  async findById(id: string): Promise<IResearchType | null> {
    return ResearchType.findOne({ _id: id, isDeleted: false }).lean() as unknown as IResearchType | null;
  }

  async create(data: Partial<IResearchType>): Promise<IResearchType> {
    return new ResearchType(data).save();
  }

  async update(id: string, data: Partial<IResearchType>, updatedBy?: string): Promise<IResearchType | null> {
    return ResearchType.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, updatedBy },
      { new: true, runValidators: true },
    );
  }

  async delete(id: string, updatedBy?: string): Promise<IResearchType | null> {
    return ResearchType.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, updatedBy },
      { new: true },
    );
  }
}

export const researchTypeRepository = new ResearchTypeRepository();
