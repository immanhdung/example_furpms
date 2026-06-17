import { cycleRepository } from '../repositories/cycle.repository';
import { CreateCycleDto, UpdateCycleDto } from '../dto/cycle.dto';
import { ApiError } from '../../../shared/apiError';
import { CYCLE_STATUS } from '../../../constants/status';
import { CYCLE_MESSAGES } from '../../../constants/messages';
import { getPaginationOptions } from '../../../shared/pagination';
import { Request } from 'express';

export class CycleService {
  async listCycles(req: Request) {
    const { page, limit, skip } = getPaginationOptions(req);
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.year) filter.year = parseInt(req.query.year as string, 10);

    const [items, total] = await Promise.all([
      cycleRepository.findAll(skip, limit, filter),
      cycleRepository.count(filter),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCycleById(id: string) {
    const cycle = await cycleRepository.findById(id);
    if (!cycle) throw ApiError.notFound(CYCLE_MESSAGES.NOT_FOUND);
    return cycle;
  }

  async createCycle(dto: CreateCycleDto, createdBy?: string) {
    return cycleRepository.create({ ...dto, createdBy: createdBy as unknown as import('mongoose').Types.ObjectId });
  }

  async updateCycle(id: string, dto: UpdateCycleDto, updatedBy?: string) {
    const cycle = await cycleRepository.findById(id);
    if (!cycle) throw ApiError.notFound(CYCLE_MESSAGES.NOT_FOUND);
    const updated = await cycleRepository.update(id, dto, updatedBy);
    if (!updated) throw ApiError.notFound(CYCLE_MESSAGES.NOT_FOUND);
    return updated;
  }

  async openCycle(id: string, updatedBy?: string) {
    const cycle = await cycleRepository.findById(id);
    if (!cycle) throw ApiError.notFound(CYCLE_MESSAGES.NOT_FOUND);
    if (cycle.status !== CYCLE_STATUS.PLANNING) {
      throw ApiError.conflict(CYCLE_MESSAGES.CANNOT_OPEN);
    }
    const updated = await cycleRepository.updateStatus(id, CYCLE_STATUS.OPEN, updatedBy);
    return updated;
  }

  async closeCycle(id: string, updatedBy?: string) {
    const cycle = await cycleRepository.findById(id);
    if (!cycle) throw ApiError.notFound(CYCLE_MESSAGES.NOT_FOUND);
    if (cycle.status !== CYCLE_STATUS.OPEN) {
      throw ApiError.conflict(CYCLE_MESSAGES.CANNOT_CLOSE);
    }
    return cycleRepository.updateStatus(id, CYCLE_STATUS.CLOSED, updatedBy);
  }
}

export const cycleService = new CycleService();
