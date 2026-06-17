import apiClient from './client'
import type { ApiResponse } from '@/types'

export const analyticsApi = {
  overview: () => apiClient.get<ApiResponse<Record<string, number>>>('/analytics/overview'),
  proposals: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<unknown>>('/analytics/proposals', { params }),
  funding: () => apiClient.get<ApiResponse<unknown>>('/analytics/funding'),
  departments: () => apiClient.get<ApiResponse<unknown>>('/analytics/departments'),
}
