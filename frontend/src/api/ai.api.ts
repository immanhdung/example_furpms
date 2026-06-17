import apiClient from './client'
import type { ApiResponse } from '@/types'

export interface AiSummaryResult {
  summary: string | null
  originalSummary: string | null
  editedText: string | null
  generatedAt: string | null
  cached?: boolean
  tokensTotal?: number
  durationMs?: number
}

export interface ReviewerSuggestion {
  _id: string
  fullName: string
  email: string
  department?: string
  academicDegree?: number
  score: number
  reason: string
}

export interface RecommendationStructured {
  overall: 'APPROVE' | 'REVISE' | 'REJECT'
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  budgetAssessment: string
  timelineAssessment: string
  summary: string
}

export interface AiRecommendation {
  recommendation: string
  structured: RecommendationStructured | null
  cached: boolean
  tokensTotal: number
  generatedAt: string
}

export interface SearchResult {
  _id: string
  titleVI: string
  titleEN?: string
  status: string
  objectives?: string
  aiSummary?: string
  totalAmount?: number
  score: number
}

export interface AiLogEntry {
  _id: string
  feature: string
  entityId?: string
  entityType?: string
  userId: { _id: string; fullName: string; email: string } | string
  prompt: string
  response: string
  model: string
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  durationMs: number
  cached: boolean
  error?: string
  createdAt: string
}

export interface AiAnalytics {
  period: { days: number; since: string }
  totalRequests: number
  byFeature: Array<{
    _id: string
    count: number
    tokens: number
    avgDuration: number
    errors: number
  }>
  byDay: Array<{
    _id: string
    requests: number
    tokens: number
    cached: number
  }>
  tokenStats: {
    totalTokens: number
    totalInput: number
    totalOutput: number
    avgTokens: number
    avgDurationMs: number
    maxDurationMs: number
  }
  cacheStats: {
    total: number
    cached: number
    hitRate: number
  }
}

export const aiApi = {
  // Proposal summary
  getProposalSummary: (id: string) =>
    apiClient.get<ApiResponse<AiSummaryResult>>(`/ai/proposals/${id}/summary`),

  summarizeProposal: (id: string, noCache = false) =>
    apiClient.post<ApiResponse<AiSummaryResult>>(`/ai/proposals/${id}/summarize`, { noCache }),

  editProposalSummary: (id: string, editedText: string) =>
    apiClient.patch<ApiResponse<{ editedText: string }>>(`/ai/proposals/${id}/summary`, {
      editedText,
    }),

  // Final report summary
  getFinalReportSummary: (id: string) =>
    apiClient.get<ApiResponse<{ summary: string | null; generatedAt: string | null }>>(
      `/ai/final-reports/${id}/summary`,
    ),

  summarizeFinalReport: (id: string, noCache = false) =>
    apiClient.post<ApiResponse<{ summary: string; cached: boolean; tokensTotal: number }>>(
      `/ai/final-reports/${id}/summarize`,
      { noCache },
    ),

  // Reviewer suggestions
  suggestReviewers: (id: string, noCache = false) =>
    apiClient.post<ApiResponse<ReviewerSuggestion[]>>(
      `/ai/proposals/${id}/suggest-reviewers`,
      { noCache },
    ),

  // AI recommendation
  getRecommendation: (id: string, noCache = false) =>
    apiClient.post<ApiResponse<AiRecommendation>>(`/ai/proposals/${id}/recommend`, { noCache }),

  // Semantic search
  searchSemantic: (query: string, limit = 10) =>
    apiClient.post<ApiResponse<SearchResult[]>>('/ai/semantic-search', { query, limit }),

  // Analytics & logs (Admin/Staff only)
  getAnalytics: (days = 30) =>
    apiClient.get<ApiResponse<AiAnalytics>>('/ai/analytics', { params: { days } }),

  getLogs: (params?: { feature?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ items: AiLogEntry[]; total: number; page: number; limit: number; totalPages: number }>>(
      '/ai/logs',
      { params },
    ),

  getCacheStats: () =>
    apiClient.get<ApiResponse<{ total: number; active: number; expired: number }>>(
      '/ai/cache/stats',
    ),
}
