import apiClient from './client'
import type { ApiResponse, Council, CouncilMember } from '@/types'

export const councilsApi = {
  create: (dto: Partial<Council>) => apiClient.post<ApiResponse<Council>>('/councils', dto),
  myMemberships: () => apiClient.get<ApiResponse<CouncilMember[]>>('/councils/my-memberships'),
  getMembers: (councilId: string) => apiClient.get<ApiResponse<CouncilMember[]>>(`/councils/${councilId}/members`),
  addMember: (councilId: string, dto: { userId: string; memberRole?: string; isExternal?: boolean }) =>
    apiClient.post<ApiResponse<CouncilMember>>(`/councils/${councilId}/members`, dto),
  removeMember: (councilId: string, memberId: string) =>
    apiClient.delete<ApiResponse<null>>(`/councils/${councilId}/members/${memberId}`),
  getMeetings: (councilId: string) => apiClient.get<ApiResponse<unknown[]>>(`/councils/${councilId}/meetings`),
  scheduleMeeting: (councilId: string, dto: unknown) =>
    apiClient.post<ApiResponse<unknown>>(`/councils/${councilId}/meetings`, dto),
  submitFeedback: (councilId: string, dto: unknown) =>
    apiClient.post<ApiResponse<unknown>>(`/councils/${councilId}/feedback`, dto),
  getFeedback: (councilId: string) => apiClient.get<ApiResponse<unknown[]>>(`/councils/${councilId}/feedback`),
  submitScore: (councilId: string, dto: unknown) =>
    apiClient.post<ApiResponse<unknown>>(`/review-scoring/councils/${councilId}/scores`, dto),
  getMyScore: (councilId: string) =>
    apiClient.get<ApiResponse<unknown>>(`/review-scoring/councils/${councilId}/scores/my`),
  submitDecision: (councilId: string, dto: unknown) =>
    apiClient.post<ApiResponse<unknown>>(`/review-scoring/councils/${councilId}/decision`, dto),
  getDecision: (councilId: string) =>
    apiClient.get<ApiResponse<unknown>>(`/review-scoring/councils/${councilId}/decision`),
  confirmResult: (councilId: string) =>
    apiClient.post<ApiResponse<Council>>(`/councils/${councilId}/confirm-result`, {}),
}
