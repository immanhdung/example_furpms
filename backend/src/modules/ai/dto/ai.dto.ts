import { z } from 'zod';

export const SemanticSearchDto = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters').max(500),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const EditSummaryDto = z.object({
  editedText: z.string().min(10, 'Summary must be at least 10 characters').max(5000),
});

export const SummarizeDto = z.object({
  noCache: z.boolean().optional().default(false),
});

export const GetLogsDto = z.object({
  feature: z
    .enum(['PROPOSAL_SUMMARY', 'FINAL_REPORT_SUMMARY', 'REVIEWER_SUGGESTION', 'RECOMMENDATION', 'SEMANTIC_SEARCH'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GetAnalyticsDto = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type SemanticSearchInput = z.infer<typeof SemanticSearchDto>;
export type EditSummaryInput = z.infer<typeof EditSummaryDto>;
export type SummarizeInput = z.infer<typeof SummarizeDto>;
export type GetLogsInput = z.infer<typeof GetLogsDto>;
export type GetAnalyticsInput = z.infer<typeof GetAnalyticsDto>;
