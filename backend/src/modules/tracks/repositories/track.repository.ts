import { Track, ITrack } from '../models/track.model';

export class TrackRepository {
  async findAll(filter: Record<string, unknown> = {}, skip = 0, limit = 100): Promise<ITrack[]> {
    return Track.find({ ...filter, isDeleted: false })
      .populate('ownerId', 'fullName email department')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as ITrack[];
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return Track.countDocuments({ ...filter, isDeleted: false });
  }

  async findById(id: string): Promise<ITrack | null> {
    return Track.findOne({ _id: id, isDeleted: false })
      .populate('ownerId', 'fullName email department')
      .lean() as unknown as ITrack | null;
  }

  async create(data: Partial<ITrack>): Promise<ITrack> {
    return new Track(data).save();
  }

  async update(id: string, data: Partial<ITrack>, updatedBy?: string): Promise<ITrack | null> {
    return Track.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, updatedBy },
      { new: true, runValidators: true },
    ).populate('ownerId', 'fullName email department');
  }

  async assignOwner(id: string, ownerId: string, updatedBy?: string): Promise<ITrack | null> {
    return Track.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ownerId, updatedBy },
      { new: true },
    ).populate('ownerId', 'fullName email department');
  }

  async deactivate(id: string, updatedBy?: string): Promise<ITrack | null> {
    return Track.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isActive: false, updatedBy },
      { new: true },
    );
  }
}

export const trackRepository = new TrackRepository();
