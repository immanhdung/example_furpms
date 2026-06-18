import * as XLSX from 'xlsx';
import { appliedTopicRepository } from '../repositories/appliedTopic.repository';
import { AppliedTopicRowDto } from '../dto/appliedTopic.dto';
import { ApiError } from '../../../shared/apiError';
import { APPLIED_TOPIC_MESSAGES } from '../../../constants/messages';

export class AppliedTopicService {
  async listByResearchType(researchTypeId: string) {
    return appliedTopicRepository.findByResearchType(researchTypeId);
  }

  async importFromExcelBuffer(researchTypeId: string, buffer: Buffer, createdBy?: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw ApiError.badRequest('Excel file is empty or invalid.');
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (!rows.length) throw ApiError.badRequest('No data rows found in Excel file.');

    const topics: AppliedTopicRowDto[] = rows.map((row) => ({
      title: String(
        row['Tên đề tài đặt hàng'] ?? row['Tên đề tài'] ?? row['title'] ?? '',
      ).trim(),
      orderingUnit: String(row['Đơn vị đặt hàng'] ?? row['orderingUnit'] ?? '').trim() || undefined,
      area: String(row['Khu vực'] ?? row['area'] ?? '').trim() || undefined,
      objectives: String(row['Mục tiêu'] ?? row['objectives'] ?? '').trim() || undefined,
      requirements: String(row['Yêu cầu'] ?? row['requirements'] ?? '').trim() || undefined,
      expectedOutput: String(row['Sản phẩm dự kiến'] ?? row['expectedOutput'] ?? '').trim() || undefined,
      applyingUnit: String(
        row['Phòng/Ban/Đơn vị/Cơ sở ứng dụng sản phẩm đề tài'] ?? row['applyingUnit'] ?? '',
      ).trim() || undefined,
      notes: String(row['Ghi chú'] ?? row['notes'] ?? '').trim() || undefined,
    })).filter((t) => t.title.length > 0);

    if (!topics.length) {
      throw ApiError.badRequest('No valid topic rows found. Ensure "Tên đề tài đặt hàng" column exists.');
    }

    await appliedTopicRepository.deleteAllByResearchType(researchTypeId, createdBy);

    const docs = topics.map((t) => ({
      ...t,
      researchTypeId: researchTypeId as unknown as import('mongoose').Types.ObjectId,
      createdBy: createdBy as unknown as import('mongoose').Types.ObjectId,
    }));

    const created = await appliedTopicRepository.createMany(docs);
    return created;
  }

  async deleteAppliedTopic(researchTypeId: string, topicId: string, updatedBy?: string) {
    const topic = await appliedTopicRepository.findById(topicId);
    if (!topic) throw ApiError.notFound(APPLIED_TOPIC_MESSAGES.NOT_FOUND);
    if (topic.researchTypeId.toString() !== researchTypeId) {
      throw ApiError.forbidden('Topic does not belong to this research type.');
    }
    return appliedTopicRepository.softDelete(topicId, updatedBy);
  }

  async countByResearchType(researchTypeId: string) {
    return appliedTopicRepository.countByResearchType(researchTypeId);
  }
}

export const appliedTopicService = new AppliedTopicService();
