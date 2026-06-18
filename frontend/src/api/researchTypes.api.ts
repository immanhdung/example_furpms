import apiClient from './client'
import type { ApiResponse, ResearchType } from '@/types'

export const researchTypesApi = {
  list: () =>
    apiClient.get<ApiResponse<ResearchType[]>>('/research-types'),
  getById: (id: string) =>
    apiClient.get<ApiResponse<ResearchType>>(`/research-types/${id}`),
  create: (dto: { name: string; code: string; description?: string }) =>
    apiClient.post<ApiResponse<ResearchType>>('/research-types', dto),
  update: (id: string, dto: Partial<ResearchType>) =>
    apiClient.put<ApiResponse<ResearchType>>(`/research-types/${id}`, dto),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/research-types/${id}`),
}
