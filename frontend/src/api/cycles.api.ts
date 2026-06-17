import apiClient from './client'
import type { ApiResponse, PaginatedData, Cycle, Track } from '@/types'

export const cyclesApi = {
  list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<PaginatedData<Cycle>>>('/cycles', { params }),
  getById: (id: string) => apiClient.get<ApiResponse<Cycle>>(`/cycles/${id}`),
  create: (dto: Partial<Cycle>) => apiClient.post<ApiResponse<Cycle>>('/cycles', dto),
  update: (id: string, dto: Partial<Cycle>) => apiClient.put<ApiResponse<Cycle>>(`/cycles/${id}`, dto),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/cycles/${id}`),
  open: (id: string) => apiClient.post<ApiResponse<Cycle>>(`/cycles/${id}/open`),
  close: (id: string) => apiClient.post<ApiResponse<Cycle>>(`/cycles/${id}/close`),
  getTracks: (id: string) => apiClient.get<ApiResponse<Track[]>>(`/cycles/${id}/tracks`),
  createTrack: (id: string, dto: Partial<Track>) => apiClient.post<ApiResponse<Track>>(`/cycles/${id}/tracks`, dto),
}
