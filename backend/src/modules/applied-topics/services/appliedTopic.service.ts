import * as XLSX from 'xlsx';
import { appliedTopicRepository } from '../repositories/appliedTopic.repository';
import { AppliedTopicRowDto } from '../dto/appliedTopic.dto';
import { ApiError } from '../../../shared/apiError';
import { APPLIED_TOPIC_MESSAGES } from '../../../constants/messages';

export class AppliedTopicService {
  async listByCycle(cycleId: string) {
    return appliedTopicRepository.findByCycle(cycleId);
  }

  async importFromExcelBuffer(cycleId: string, buffer: Buffer, createdBy?: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw ApiError.badRequest('Excel file is empty or invalid.');
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (!rows.length) throw ApiError.badRequest('No data rows found in Excel file.');

    const topics: AppliedTopicRowDto[] = rows.map((row) => ({
      title: String(row['Tên đề tài'] ?? row['title'] ?? row['Title'] ?? '').trim(),
      topicType: String(row['Loại đề tài'] ?? row['topicType'] ?? row['Topic Type'] ?? '').trim() || undefined,
      description: String(row['Mô tả'] ?? row['description'] ?? row['Description'] ?? '').trim() || undefined,
      orderingOrganization: String(row['Đơn vị đặt hàng'] ?? row['orderingOrganization'] ?? '').trim() || undefined,
      maxSelections: Number(row['Số lượng nhóm tối đa'] ?? row['maxSelections'] ?? 1) || 1,
    })).filter((t) => t.title.length > 0);

    if (!topics.length) throw ApiError.badRequest('No valid topic rows found. Ensure "Tên đề tài" column exists.');

    await appliedTopicRepository.deleteAllByCycle(cycleId, createdBy);

    const docs = topics.map((t) => ({
      ...t,
      cycleId: cycleId as unknown as import('mongoose').Types.ObjectId,
      createdBy: createdBy as unknown as import('mongoose').Types.ObjectId,
    }));

    const created = await appliedTopicRepository.createMany(docs);
    return created;
  }

  async deleteAppliedTopic(cycleId: string, topicId: string, updatedBy?: string) {
    const topic = await appliedTopicRepository.findById(topicId);
    if (!topic) throw ApiError.notFound(APPLIED_TOPIC_MESSAGES.NOT_FOUND);
    if (topic.cycleId.toString() !== cycleId) throw ApiError.forbidden('Topic does not belong to this cycle.');
    return appliedTopicRepository.softDelete(topicId, updatedBy);
  }
}

export const appliedTopicService = new AppliedTopicService();
