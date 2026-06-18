import { AppliedTopic, IAppliedTopic } from '../models/appliedTopic.model';

export class AppliedTopicRepository {
  async findByResearchType(researchTypeId: string): Promise<IAppliedTopic[]> {
    return AppliedTopic.find({ researchTypeId, isDeleted: false })
      .sort({ orderingUnit: 1, title: 1 })
      .lean() as unknown as IAppliedTopic[];
  }

  async findById(id: string): Promise<IAppliedTopic | null> {
    return AppliedTopic.findOne({ _id: id, isDeleted: false }).lean() as unknown as IAppliedTopic | null;
  }

  async createMany(docs: Partial<IAppliedTopic>[]): Promise<IAppliedTopic[]> {
    return AppliedTopic.insertMany(docs) as unknown as IAppliedTopic[];
  }

  async deleteAllByResearchType(researchTypeId: string, updatedBy?: string): Promise<void> {
    await AppliedTopic.updateMany(
      { researchTypeId, isDeleted: false },
      { isDeleted: true, updatedBy },
    );
  }

  async softDelete(id: string, updatedBy?: string): Promise<IAppliedTopic | null> {
    return AppliedTopic.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, updatedBy },
      { new: true },
    );
  }

  async countByResearchType(researchTypeId: string): Promise<number> {
    return AppliedTopic.countDocuments({ researchTypeId, isDeleted: false });
  }
}

export const appliedTopicRepository = new AppliedTopicRepository();
