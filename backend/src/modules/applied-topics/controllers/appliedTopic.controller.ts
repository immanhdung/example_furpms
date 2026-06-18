import { Request, Response } from 'express';
import { appliedTopicService } from '../services/appliedTopic.service';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { asyncHandler } from '../../../shared/asyncHandler';
import { APPLIED_TOPIC_MESSAGES } from '../../../constants/messages';
import { ApiError } from '../../../shared/apiError';

export const listAppliedTopics = asyncHandler(async (req: Request, res: Response) => {
  const topics = await appliedTopicService.listByResearchType(req.params.researchTypeId);
  sendSuccess(res, topics, APPLIED_TOPIC_MESSAGES.LIST_FETCHED);
});

export const importAppliedTopics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No Excel file uploaded. Use multipart/form-data with field "file".');
  const topics = await appliedTopicService.importFromExcelBuffer(
    req.params.researchTypeId,
    req.file.buffer,
    req.user?.sub,
  );
  sendCreated(res, { count: topics.length, topics }, APPLIED_TOPIC_MESSAGES.IMPORTED);
});

export const deleteAppliedTopic = asyncHandler(async (req: Request, res: Response) => {
  await appliedTopicService.deleteAppliedTopic(
    req.params.researchTypeId,
    req.params.topicId,
    req.user?.sub,
  );
  sendSuccess(res, null, APPLIED_TOPIC_MESSAGES.DELETED);
});
