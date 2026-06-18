import apiClient from './client'
import type { ApiResponse, PaginatedData, Cycle, Track, AppliedTopic } from '@/types'

export const cyclesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<PaginatedData<Cycle>>>('/cycles', { params }),
  getById: (id: string) =>
    apiClient.get<ApiResponse<Cycle>>(`/cycles/${id}`),
  create: (dto: { name: string; code?: string }) =>
    apiClient.post<ApiResponse<Cycle>>('/cycles', dto),
  configure: (id: string, dto: Partial<Cycle>) =>
    apiClient.patch<ApiResponse<Cycle>>(`/cycles/${id}/configure`, dto),
  update: (id: string, dto: Partial<Cycle>) =>
    apiClient.put<ApiResponse<Cycle>>(`/cycles/${id}`, dto),
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/cycles/${id}`),
  open: (id: string) =>
    apiClient.post<ApiResponse<Cycle>>(`/cycles/${id}/open`),
  close: (id: string) =>
    apiClient.post<ApiResponse<Cycle>>(`/cycles/${id}/close`),
  getTracks: (id: string) =>
    apiClient.get<ApiResponse<Track[]>>(`/cycles/${id}/tracks`),
  createTrack: (id: string, dto: Partial<Track>) =>
    apiClient.post<ApiResponse<Track>>(`/cycles/${id}/tracks`, dto),
  getAppliedTopics: (cycleId: string) =>
    apiClient.get<ApiResponse<AppliedTopic[]>>(`/cycles/${cycleId}/applied-topics`),
  importAppliedTopics: (cycleId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<{ count: number; topics: AppliedTopic[] }>>(
      `/cycles/${cycleId}/applied-topics/import`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },
  deleteAppliedTopic: (cycleId: string, topicId: string) =>
    apiClient.delete<ApiResponse<null>>(`/cycles/${cycleId}/applied-topics/${topicId}`),
}
