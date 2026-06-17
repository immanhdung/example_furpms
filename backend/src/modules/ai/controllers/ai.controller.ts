import { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess } from '../../../shared/response';
import { Proposal } from '../../proposals/models/proposal.model';
import { ApiError } from '../../../shared/apiError';
import { getGeminiModel, generateEmbedding } from '../../../configs/gemini';
import mongoose from 'mongoose';

export const getAiSummary = asyncHandler(async (req: Request, res: Response) => {
  const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false }).select('aiSummary aiSummaryEditedText aiSummaryGeneratedAt titleVI titleEN');
  if (!proposal) throw ApiError.notFound('Proposal not found.');

  sendSuccess(res, {
    summary: proposal.aiSummaryEditedText || proposal.aiSummary || null,
    originalSummary: proposal.aiSummary || null,
    editedText: proposal.aiSummaryEditedText || null,
    generatedAt: proposal.aiSummaryGeneratedAt || null,
  }, 'AI summary retrieved.');
});

export const generateAiSummary = asyncHandler(async (req: Request, res: Response) => {
  const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false });
  if (!proposal) throw ApiError.notFound('Proposal not found.');

  let model;
  try {
    model = getGeminiModel();
  } catch {
    throw ApiError.internal('Gemini AI not configured. Please set GEMINI_API_KEY.');
  }

  const prompt = `
Bạn là trợ lý AI chuyên phân tích đề xuất nghiên cứu khoa học. Hãy tóm tắt đề xuất sau một cách ngắn gọn, rõ ràng và học thuật bằng tiếng Việt (tối đa 300 từ):

Tên đề tài (tiếng Việt): ${proposal.titleVI}
Tên đề tài (tiếng Anh): ${proposal.titleEN}
Loại nghiên cứu: ${proposal.researchType === 1 ? 'Nghiên cứu ứng dụng' : 'Nghiên cứu cơ bản'}
Thời gian thực hiện: ${proposal.durationMonths} tháng
Tổng kinh phí: ${proposal.totalAmount.toLocaleString('vi-VN')} VNĐ
Mục tiêu: ${proposal.objectives}
Phương pháp nghiên cứu: ${proposal.methodology}
Kết quả mong đợi: ${proposal.expectedOutput}

Hãy tóm tắt bao gồm: mục tiêu chính, phương pháp tiếp cận, kết quả dự kiến và ý nghĩa của nghiên cứu.
`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  // Generate embedding for semantic search
  let embedding: number[] | undefined;
  try {
    const embeddingText = `${proposal.titleVI} ${proposal.titleEN} ${proposal.objectives} ${proposal.methodology}`;
    embedding = await generateEmbedding(embeddingText);
  } catch {
    // Embedding failure is non-fatal
  }

  await Proposal.findByIdAndUpdate(proposal._id, {
    aiSummary: summary,
    aiSummaryGeneratedAt: new Date(),
    updatedBy: new mongoose.Types.ObjectId(req.user!.sub),
    ...(embedding ? { embedding } : {}),
  });

  sendSuccess(res, { summary, generatedAt: new Date() }, 'AI summary generated.');
});

export const editAiSummary = asyncHandler(async (req: Request, res: Response) => {
  const { editedText } = req.body;
  if (!editedText || typeof editedText !== 'string') {
    throw ApiError.badRequest('editedText is required.');
  }

  const proposal = await Proposal.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { aiSummaryEditedText: editedText, updatedBy: new mongoose.Types.ObjectId(req.user!.sub) },
    { new: true },
  ).select('aiSummary aiSummaryEditedText aiSummaryGeneratedAt');

  if (!proposal) throw ApiError.notFound('Proposal not found.');
  sendSuccess(res, { editedText: proposal.aiSummaryEditedText }, 'AI summary updated.');
});

export const semanticSearch = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit = 10 } = req.body;
  if (!query || typeof query !== 'string') throw ApiError.badRequest('query is required.');

  let embedding: number[];
  try {
    embedding = await generateEmbedding(query);
  } catch {
    throw ApiError.internal('Embedding generation failed. Check GEMINI_API_KEY configuration.');
  }

  // MongoDB Atlas Vector Search
  const results = await Proposal.aggregate([
    {
      $vectorSearch: {
        index: 'proposal_embedding_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 100,
        limit: parseInt(String(limit), 10),
      },
    },
    {
      $project: {
        titleVI: 1,
        titleEN: 1,
        status: 1,
        piId: 1,
        totalAmount: 1,
        aiSummary: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]);

  sendSuccess(res, results, 'Semantic search results retrieved.');
});
