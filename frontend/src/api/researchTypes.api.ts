import apiClient from './client'
import type { ApiResponse, ResearchType, AppliedTopic } from '@/types'

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

  // Topic management
  getTopics: (researchTypeId: string) =>
    apiClient.get<ApiResponse<AppliedTopic[]>>(`/research-types/${researchTypeId}/topics`),
  importTopics: (researchTypeId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<{ count: number; topics: AppliedTopic[] }>>(
      `/research-types/${researchTypeId}/topics/import`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },
  deleteTopic: (researchTypeId: string, topicId: string) =>
    apiClient.delete<ApiResponse<null>>(`/research-types/${researchTypeId}/topics/${topicId}`),
}
