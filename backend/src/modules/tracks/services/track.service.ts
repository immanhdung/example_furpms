import { trackRepository } from '../repositories/track.repository';
import { CreateTrackDto, UpdateTrackDto, AssignOwnerDto } from '../dto/track.dto';
import { ApiError } from '../../../shared/apiError';
import { TRACK_MESSAGES } from '../../../constants/messages';
import { getPaginationOptions } from '../../../shared/pagination';
import { Request } from 'express';

export class TrackService {
  async listTracks(req: Request) {
    const { page, limit, skip } = getPaginationOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.activeOnly === 'true') filter.isActive = true;

    const [items, total] = await Promise.all([
      trackRepository.findAll(filter, skip, limit),
      trackRepository.count(filter),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTrackById(id: string) {
    const track = await trackRepository.findById(id);
    if (!track) throw ApiError.notFound(TRACK_MESSAGES.NOT_FOUND);
    return track;
  }

  async createTrack(dto: CreateTrackDto, createdBy?: string) {
    return trackRepository.create({ ...dto, createdBy: createdBy as unknown as import('mongoose').Types.ObjectId });
  }

  async updateTrack(id: string, dto: UpdateTrackDto, updatedBy?: string) {
    const track = await trackRepository.findById(id);
    if (!track) throw ApiError.notFound(TRACK_MESSAGES.NOT_FOUND);
    const updated = await trackRepository.update(id, dto, updatedBy);
    if (!updated) throw ApiError.notFound(TRACK_MESSAGES.NOT_FOUND);
    return updated;
  }

  async assignOwner(id: string, dto: AssignOwnerDto, updatedBy?: string) {
    const track = await trackRepository.findById(id);
    if (!track) throw ApiError.notFound(TRACK_MESSAGES.NOT_FOUND);
    return trackRepository.assignOwner(id, dto.ownerId, updatedBy);
  }

  async deactivate(id: string, updatedBy?: string) {
    const track = await trackRepository.findById(id);
    if (!track) throw ApiError.notFound(TRACK_MESSAGES.NOT_FOUND);
    return trackRepository.deactivate(id, updatedBy);
  }
}

export const trackService = new TrackService();
