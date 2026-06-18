import { researchTypeRepository } from '../repositories/researchType.repository';
import { CreateResearchTypeDto, UpdateResearchTypeDto } from '../dto/researchType.dto';
import { ApiError } from '../../../shared/apiError';
import { RESEARCH_TYPE_MESSAGES } from '../../../constants/messages';

export class ResearchTypeService {
  async listResearchTypes() {
    return researchTypeRepository.findAll();
  }

  async getResearchTypeById(id: string) {
    const rt = await researchTypeRepository.findById(id);
    if (!rt) throw ApiError.notFound(RESEARCH_TYPE_MESSAGES.NOT_FOUND);
    return rt;
  }

  async createResearchType(dto: CreateResearchTypeDto, createdBy?: string) {
    return researchTypeRepository.create({
      ...dto,
      createdBy: createdBy as unknown as import('mongoose').Types.ObjectId,
    });
  }

  async updateResearchType(id: string, dto: UpdateResearchTypeDto, updatedBy?: string) {
    const rt = await researchTypeRepository.findById(id);
    if (!rt) throw ApiError.notFound(RESEARCH_TYPE_MESSAGES.NOT_FOUND);
    return researchTypeRepository.update(id, dto, updatedBy);
  }

  async deleteResearchType(id: string, updatedBy?: string) {
    const rt = await researchTypeRepository.findById(id);
    if (!rt) throw ApiError.notFound(RESEARCH_TYPE_MESSAGES.NOT_FOUND);
    return researchTypeRepository.delete(id, updatedBy);
  }
}

export const researchTypeService = new ResearchTypeService();
