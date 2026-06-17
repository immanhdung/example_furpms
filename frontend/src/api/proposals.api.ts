import apiClient from './client'
import type { ApiResponse, PaginatedData, Proposal } from '@/types'

export const proposalsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<PaginatedData<Proposal>>>('/proposals', { params }),
  getById: (id: string) => apiClient.get<ApiResponse<Proposal>>(`/proposals/${id}`),
  create: (dto: Partial<Proposal>) => apiClient.post<ApiResponse<Proposal>>('/proposals', dto),
  update: (id: string, dto: Partial<Proposal>) => apiClient.put<ApiResponse<Proposal>>(`/proposals/${id}`, dto),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/proposals/${id}`),
  submit: (id: string) => apiClient.post<ApiResponse<Proposal>>(`/proposals/${id}/submit`),
  myProposals: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<PaginatedData<Proposal>>>('/proposals/my', { params }),
  summarize: (id: string) => apiClient.post<ApiResponse<{ summary: string }>>(`/ai/proposals/${id}/summarize`),
}
