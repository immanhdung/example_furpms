import { AppliedTopic, IAppliedTopic } from '../models/appliedTopic.model';

export class AppliedTopicRepository {
  async findByCycle(cycleId: string): Promise<IAppliedTopic[]> {
    return AppliedTopic.find({ cycleId, isDeleted: false })
      .sort({ topicType: 1, title: 1 })
      .lean() as unknown as IAppliedTopic[];
  }

  async findById(id: string): Promise<IAppliedTopic | null> {
    return AppliedTopic.findOne({ _id: id, isDeleted: false }).lean() as unknown as IAppliedTopic | null;
  }

  async createMany(docs: Partial<IAppliedTopic>[]): Promise<IAppliedTopic[]> {
    return AppliedTopic.insertMany(docs) as unknown as IAppliedTopic[];
  }

  async deleteAllByCycle(cycleId: string, updatedBy?: string): Promise<void> {
    await AppliedTopic.updateMany(
      { cycleId, isDeleted: false },
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

  async incrementSelection(id: string): Promise<void> {
    await AppliedTopic.updateOne({ _id: id }, { $inc: { currentSelections: 1 } });
  }
}

export const appliedTopicRepository = new AppliedTopicRepository();
