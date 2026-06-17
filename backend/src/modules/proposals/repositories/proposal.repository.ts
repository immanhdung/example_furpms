import mongoose from 'mongoose';
import { Proposal, IProposal } from '../models/proposal.model';

export class ProposalRepository {
  async findAll(
    filter: Record<string, unknown> = {},
    skip = 0,
    limit = 20,
  ): Promise<IProposal[]> {
    return Proposal.find({ ...filter, isDeleted: false })
      .populate('trackId', 'name code')
      .populate('piId', 'fullName email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as IProposal[];
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return Proposal.countDocuments({ ...filter, isDeleted: false });
  }

  async findById(id: string): Promise<IProposal | null> {
    return Proposal.findOne({ _id: id, isDeleted: false })
      .populate('trackId', 'name code description')
      .populate('piId', 'fullName email department phoneNumber')
      .lean() as unknown as IProposal | null;
  }

  async findByPiId(piId: string, filter: Record<string, unknown> = {}): Promise<IProposal[]> {
    return Proposal.find({ piId, ...filter, isDeleted: false })
      .populate('trackId', 'name code')
      .sort({ createdAt: -1 })
      .lean() as unknown as IProposal[];
  }

  async create(data: Partial<IProposal>): Promise<IProposal> {
    const proposal = new Proposal(data);
    return proposal.save();
  }

  async update(id: string, data: Partial<IProposal>, updatedBy?: string): Promise<IProposal | null> {
    return Proposal.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, updatedBy },
      { new: true, runValidators: true },
    )
      .populate('trackId', 'name code')
      .populate('piId', 'fullName email department');
  }

  async updateStatus(id: string, status: string, extraData: Record<string, unknown> = {}, updatedBy?: string): Promise<IProposal | null> {
    return Proposal.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status, ...extraData, updatedBy },
      { new: true },
    );
  }

  async softDelete(id: string, deletedBy?: string): Promise<IProposal | null> {
    return Proposal.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), deletedBy },
      { new: true },
    );
  }
}

export const proposalRepository = new ProposalRepository();
