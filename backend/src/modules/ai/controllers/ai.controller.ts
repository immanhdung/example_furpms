import { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/asyncHandler';
import { sendSuccess, sendCreated } from '../../../shared/response';
import { ApiError } from '../../../shared/apiError';
import { aiService } from '../services/ai.service';
import { AiFeature } from '../models/aiLog.model';

// ── Proposal Summary ────────────────────────────────────────────

export const getProposalSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await aiService.getProposalSummary(req.params.id);
  sendSuccess(res, data, 'AI summary retrieved.');
});

export const generateProposalSummary = asyncHandler(async (req: Request, res: Response) => {
  const { noCache } = req.body as { noCache?: boolean };
  const data = await aiService.summarizeProposal(req.params.id, req.user!.sub, noCache ?? false);
  sendCreated(res, data, 'AI summary generated.');
});

export const editProposalSummary = asyncHandler(async (req: Request, res: Response) => {
  const { editedText } = req.body as { editedText?: string };
  if (!editedText || typeof editedText !== 'string') {
    throw ApiError.badRequest('editedText is required.');
  }
  const data = await aiService.editProposalSummary(req.params.id, editedText, req.user!.sub);
  sendSuccess(res, data, 'AI summary updated.');
});

// ── Final Report Summary ────────────────────────────────────────

export const getFinalReportSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await aiService.getFinalReportSummary(req.params.id);
  sendSuccess(res, data, 'Report summary retrieved.');
});

export const generateFinalReportSummary = asyncHandler(async (req: Request, res: Response) => {
  const { noCache } = req.body as { noCache?: boolean };
  const data = await aiService.summarizeFinalReport(req.params.id, req.user!.sub, noCache ?? false);
  sendCreated(res, data, 'Report AI summary generated.');
});

// ── Reviewer Suggestions ────────────────────────────────────────

export const suggestReviewers = asyncHandler(async (req: Request, res: Response) => {
  const { noCache } = req.body as { noCache?: boolean };
  const data = await aiService.suggestReviewers(req.params.id, req.user!.sub, noCache ?? false);
  sendSuccess(res, data, 'Reviewer suggestions generated.');
});

// ── AI Recommendation ───────────────────────────────────────────

export const getRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const { noCache } = req.body as { noCache?: boolean };
  const data = await aiService.getRecommendation(req.params.id, req.user!.sub, noCache ?? false);
  sendSuccess(res, data, 'AI recommendation generated.');
});

// ── Semantic Search ─────────────────────────────────────────────

export const semanticSearch = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit } = req.body as { query?: string; limit?: number };
  if (!query || typeof query !== 'string') {
    throw ApiError.badRequest('query is required.');
  }
  const results = await aiService.semanticSearch(query, Number(limit ?? 10), req.user!.sub);
  sendSuccess(res, results, 'Semantic search results retrieved.');
});

// ── Analytics & Logs ────────────────────────────────────────────

export const getAiAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const days = Number(req.query.days ?? 30);
  const data = await aiService.getAnalytics(days);
  sendSuccess(res, data, 'AI analytics retrieved.');
});

export const getAiLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const feature = req.query.feature as AiFeature | undefined;
  const data = await aiService.getLogs({ feature, page, limit }) as { items: unknown[]; total: number; page: number; limit: number; totalPages: number };
  sendSuccess(
    res,
    { items: data.items, total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages },
    'AI logs retrieved.',
  );
});

export const getCacheStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await aiService.getCacheStats();
  sendSuccess(res, data, 'Cache stats retrieved.');
});
