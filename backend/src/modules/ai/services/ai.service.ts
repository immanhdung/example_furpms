import mongoose from 'mongoose';
import { geminiService, GenerateOptions } from './gemini.service';
import { Proposal } from '../../proposals/models/proposal.model';
import { FinalReport } from '../../final-reports/models/finalReport.model';
import { User } from '../../users/models/user.model';
import { ApiError } from '../../../shared/apiError';
import { aiLogRepository } from '../repositories/aiLog.repository';
import { aiCacheRepository } from '../repositories/aiCache.repository';
import { AiLog, AiFeature } from '../models/aiLog.model';

// ── Prompt builders ─────────────────────────────────────────────

interface ProposalData {
  titleVI: string;
  titleEN: string;
  researchType: number;
  durationMonths: number;
  totalAmount: number;
  objectives: string;
  methodology: string;
  expectedOutput: string;
}

function proposalSummaryPrompt(p: ProposalData): string {
  return `Bạn là trợ lý AI chuyên phân tích đề xuất nghiên cứu khoa học tại Trường Đại học FPT.
Hãy tóm tắt đề xuất sau một cách ngắn gọn, súc tích và học thuật bằng tiếng Việt (tối đa 300 từ).

THÔNG TIN ĐỀ XUẤT:
- Tên đề tài (Tiếng Việt): ${p.titleVI}
- Tên đề tài (Tiếng Anh): ${p.titleEN}
- Loại nghiên cứu: ${p.researchType === 1 ? 'Nghiên cứu ứng dụng' : 'Nghiên cứu cơ bản'}
- Thời gian thực hiện: ${p.durationMonths} tháng
- Tổng kinh phí: ${p.totalAmount.toLocaleString('vi-VN')} VNĐ
- Mục tiêu nghiên cứu: ${p.objectives}
- Phương pháp nghiên cứu: ${p.methodology}
- Kết quả mong đợi: ${p.expectedOutput}

YÊU CẦU: Tóm tắt gồm 4 phần: (1) Vấn đề & mục tiêu, (2) Phương pháp tiếp cận, (3) Kết quả dự kiến, (4) Ý nghĩa khoa học và thực tiễn.
Chỉ trả về nội dung tóm tắt, không có tiêu đề hay ghi chú thêm.`;
}

interface ReportData {
  title: string;
  summary: string;
  achievements: string;
  challenges?: string;
  recommendations?: string;
}

function reportSummaryPrompt(r: ReportData): string {
  return `Bạn là trợ lý AI chuyên phân tích báo cáo tổng kết nghiên cứu khoa học tại Trường Đại học FPT.
Hãy tóm tắt báo cáo sau một cách học thuật bằng tiếng Việt (tối đa 400 từ).

THÔNG TIN BÁO CÁO:
- Tiêu đề: ${r.title}
- Tóm tắt gốc: ${r.summary}
- Kết quả đạt được: ${r.achievements}
- Khó khăn: ${r.challenges ?? 'Không đề cập'}
- Kiến nghị: ${r.recommendations ?? 'Không đề cập'}

YÊU CẦU: Tóm tắt gồm: (1) Kết quả nổi bật, (2) Đóng góp khoa học/thực tiễn, (3) Khó khăn & bài học, (4) Kiến nghị.
Chỉ trả về nội dung tóm tắt.`;
}

interface ReviewerData {
  _id: unknown;
  fullName: string;
  department?: string;
  academicDegree?: number;
}

function reviewerSuggestionPrompt(
  p: { titleVI: string; objectives: string; methodology: string; expectedOutput: string },
  reviewers: ReviewerData[],
): string {
  const list = reviewers
    .map(
      (r, i) =>
        `${i + 1}. ID: ${String(r._id)} | Họ tên: ${r.fullName} | Đơn vị: ${r.department ?? 'N/A'} | Học vị: ${r.academicDegree ?? 'N/A'}`,
    )
    .join('\n');

  return `Bạn là hệ thống gợi ý người phản biện cho đề xuất nghiên cứu khoa học tại FPT University.
Phân tích đề xuất và gợi ý TOP 5 người phản biện phù hợp nhất.

ĐỀ XUẤT:
- Tên: ${p.titleVI}
- Mục tiêu: ${p.objectives}
- Phương pháp: ${p.methodology}
- Kết quả mong đợi: ${p.expectedOutput}

DANH SÁCH NGƯỜI PHẢN BIỆN:
${list}

Trả về JSON array (chỉ JSON, không có text khác):
[{"userId":"<ID>","fullName":"<tên>","score":<0.0-1.0>,"reason":"<lý do ngắn gọn tiếng Việt>"}]`;
}

function recommendationPrompt(p: ProposalData): string {
  return `Bạn là chuyên gia tư vấn nghiên cứu khoa học tại FPT University.
Phân tích đề xuất và đưa ra khuyến nghị chi tiết.

ĐỀ XUẤT:
- Tên: ${p.titleVI}
- Loại: ${p.researchType === 1 ? 'Ứng dụng' : 'Cơ bản'}
- Thời gian: ${p.durationMonths} tháng
- Kinh phí: ${p.totalAmount.toLocaleString('vi-VN')} VNĐ
- Mục tiêu: ${p.objectives}
- Phương pháp: ${p.methodology}
- Kết quả mong đợi: ${p.expectedOutput}

Trả về JSON (chỉ JSON):
{
  "overall": "APPROVE",
  "score": 80,
  "strengths": ["điểm mạnh 1"],
  "weaknesses": ["điểm yếu 1"],
  "suggestions": ["gợi ý cải thiện 1"],
  "budgetAssessment": "đánh giá ngân sách",
  "timelineAssessment": "đánh giá tiến độ",
  "summary": "tóm tắt khuyến nghị tổng thể tiếng Việt"
}

overall phải là một trong: APPROVE, REVISE, REJECT`;
}

// ── Service ─────────────────────────────────────────────────────

type ProposalDoc = ProposalData & {
  _id: unknown;
  aiSummary?: string;
  aiSummaryEditedText?: string;
  aiSummaryGeneratedAt?: Date;
  embedding?: number[];
};

type ReportDoc = ReportData & {
  _id: unknown;
  aiSummary?: string;
  aiSummaryGeneratedAt?: Date;
};

interface ReviewerSuggestion {
  userId: string;
  fullName: string;
  score: number;
  reason: string;
}

interface RecommendationStructured {
  overall: 'APPROVE' | 'REVISE' | 'REJECT';
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  budgetAssessment: string;
  timelineAssessment: string;
  summary: string;
}

export const aiService: {
  summarizeProposal(proposalId: string, userId: string, noCache?: boolean): Promise<unknown>;
  getProposalSummary(proposalId: string): Promise<unknown>;
  editProposalSummary(proposalId: string, editedText: string, userId: string): Promise<unknown>;
  summarizeFinalReport(reportId: string, userId: string, noCache?: boolean): Promise<unknown>;
  getFinalReportSummary(reportId: string): Promise<unknown>;
  suggestReviewers(proposalId: string, userId: string, noCache?: boolean): Promise<unknown>;
  getRecommendation(proposalId: string, userId: string, noCache?: boolean): Promise<unknown>;
  semanticSearch(query: string, limit: number, userId: string): Promise<unknown[]>;
  getAnalytics(days: number): Promise<unknown>;
  getLogs(filter: unknown): Promise<unknown>;
  getCacheStats(): Promise<unknown>;
} = {
  // 1. Proposal Summary
  async summarizeProposal(proposalId: string, userId: string, noCache = false) {
    const proposal = (await Proposal.findOne({
      _id: proposalId,
      isDeleted: false,
    })) as ProposalDoc | null;
    if (!proposal) throw ApiError.notFound('Proposal not found.');

    const opts: GenerateOptions = {
      feature: 'PROPOSAL_SUMMARY',
      entityId: proposalId,
      entityType: 'Proposal',
      userId,
      noCache,
    };
    const prompt = proposalSummaryPrompt(proposal);
    const result = await geminiService.generate(prompt, opts);

    try {
      const embeddingText = `${proposal.titleVI} ${proposal.titleEN} ${proposal.objectives} ${proposal.methodology}`;
      const embedding = await geminiService.generateEmbedding(embeddingText);
      await Proposal.findByIdAndUpdate(proposalId, {
        aiSummary: result.text,
        aiSummaryGeneratedAt: new Date(),
        embedding,
        updatedBy: new mongoose.Types.ObjectId(userId),
      });
    } catch {
      await Proposal.findByIdAndUpdate(proposalId, {
        aiSummary: result.text,
        aiSummaryGeneratedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    return {
      summary: result.text,
      cached: result.cached,
      tokensTotal: result.tokensTotal,
      durationMs: result.durationMs,
      generatedAt: new Date(),
    };
  },

  async getProposalSummary(proposalId: string) {
    const proposal = (await Proposal.findOne({ _id: proposalId, isDeleted: false }).select(
      'aiSummary aiSummaryEditedText aiSummaryGeneratedAt titleVI',
    )) as ProposalDoc | null;
    if (!proposal) throw ApiError.notFound('Proposal not found.');
    return {
      summary: proposal.aiSummaryEditedText ?? proposal.aiSummary ?? null,
      originalSummary: proposal.aiSummary ?? null,
      editedText: proposal.aiSummaryEditedText ?? null,
      generatedAt: proposal.aiSummaryGeneratedAt ?? null,
    };
  },

  async editProposalSummary(proposalId: string, editedText: string, userId: string) {
    const proposal = await Proposal.findOneAndUpdate(
      { _id: proposalId, isDeleted: false },
      { aiSummaryEditedText: editedText, updatedBy: new mongoose.Types.ObjectId(userId) },
      { new: true },
    ).select('aiSummaryEditedText');
    if (!proposal) throw ApiError.notFound('Proposal not found.');
    return { editedText: (proposal as unknown as { aiSummaryEditedText: string }).aiSummaryEditedText };
  },

  // 2. Final Report Summary
  async summarizeFinalReport(reportId: string, userId: string, noCache = false) {
    const report = (await FinalReport.findOne({
      _id: reportId,
      isDeleted: false,
    })) as ReportDoc | null;
    if (!report) throw ApiError.notFound('Final report not found.');

    const opts: GenerateOptions = {
      feature: 'FINAL_REPORT_SUMMARY',
      entityId: reportId,
      entityType: 'FinalReport',
      userId,
      noCache,
    };
    const prompt = reportSummaryPrompt(report);
    const result = await geminiService.generate(prompt, opts);

    await FinalReport.findByIdAndUpdate(reportId, {
      aiSummary: result.text,
      aiSummaryGeneratedAt: new Date(),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    return {
      summary: result.text,
      cached: result.cached,
      tokensTotal: result.tokensTotal,
      durationMs: result.durationMs,
    };
  },

  async getFinalReportSummary(reportId: string) {
    const report = (await FinalReport.findOne({ _id: reportId, isDeleted: false }).select(
      'aiSummary aiSummaryGeneratedAt title',
    )) as ReportDoc | null;
    if (!report) throw ApiError.notFound('Final report not found.');
    return {
      summary: report.aiSummary ?? null,
      generatedAt: report.aiSummaryGeneratedAt ?? null,
    };
  },

  // 3. Reviewer Suggestions
  async suggestReviewers(proposalId: string, userId: string, noCache = false) {
    const proposal = (await Proposal.findOne({
      _id: proposalId,
      isDeleted: false,
    })) as ProposalDoc | null;
    if (!proposal) throw ApiError.notFound('Proposal not found.');

    const reviewers = await User.find({
      roles: 'ReviewCommittee',
      isDeleted: false,
      status: 'ACTIVE',
    })
      .select('_id fullName email department academicDegree')
      .limit(30)
      .lean();

    if (reviewers.length === 0) return [];

    const opts: GenerateOptions = {
      feature: 'REVIEWER_SUGGESTION',
      entityId: proposalId,
      entityType: 'Proposal',
      userId,
      noCache,
    };
    const prompt = reviewerSuggestionPrompt(proposal, reviewers as ReviewerData[]);
    const result = await geminiService.generate(prompt, opts);

    let suggestions: ReviewerSuggestion[] = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0]) as ReviewerSuggestion[];
    } catch {
      return reviewers
        .slice(0, 5)
        .map((r) => ({ ...r, score: 0.5, reason: 'Phù hợp theo chuyên ngành' }));
    }

    return suggestions
      .map((s) => {
        const user = reviewers.find((r) => String(r._id) === s.userId);
        if (!user) return null;
        return { ...user, score: Math.min(1, Math.max(0, s.score ?? 0.5)), reason: s.reason };
      })
      .filter(Boolean);
  },

  // 4. AI Recommendation
  async getRecommendation(proposalId: string, userId: string, noCache = false) {
    const proposal = (await Proposal.findOne({
      _id: proposalId,
      isDeleted: false,
    })) as ProposalDoc | null;
    if (!proposal) throw ApiError.notFound('Proposal not found.');

    const opts: GenerateOptions = {
      feature: 'RECOMMENDATION',
      entityId: proposalId,
      entityType: 'Proposal',
      userId,
      noCache,
      temperature: 0.3,
    };
    const prompt = recommendationPrompt(proposal);
    const result = await geminiService.generate(prompt, opts);

    let structured: RecommendationStructured | null = null;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) structured = JSON.parse(jsonMatch[0]) as RecommendationStructured;
    } catch {
      // use raw text
    }

    return {
      recommendation: result.text,
      structured,
      cached: result.cached,
      tokensTotal: result.tokensTotal,
      generatedAt: new Date(),
    };
  },

  // 5. Semantic Search
  async semanticSearch(query: string, limit: number, userId: string) {
    const embedding = await geminiService.generateEmbedding(query);

    try {
      await AiLog.create({
        feature: 'SEMANTIC_SEARCH' as AiFeature,
        userId: new mongoose.Types.ObjectId(userId),
        prompt: query.slice(0, 500),
        response: '',
        aiModel: 'text-embedding-004',
        tokensInput: 0,
        tokensOutput: 0,
        tokensTotal: 0,
        durationMs: 0,
        cached: false,
      });
    } catch {
      // non-fatal
    }

    const results = await Proposal.aggregate([
      {
        $vectorSearch: {
          index: 'proposal_embedding_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit,
        },
      },
      { $match: { isDeleted: false } },
      {
        $project: {
          titleVI: 1,
          titleEN: 1,
          status: 1,
          piId: 1,
          totalAmount: 1,
          aiSummary: 1,
          objectives: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results;
  },

  // Analytics
  async getAnalytics(days: number) {
    return aiLogRepository.getAnalytics(days);
  },

  // Logs
  async getLogs(filter: { feature?: AiFeature; userId?: string; page: number; limit: number }) {
    return aiLogRepository.findAll(filter);
  },

  // Cache stats
  async getCacheStats() {
    return aiCacheRepository.getStats();
  },
};
