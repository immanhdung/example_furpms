import apiClient from './client'
import type { ApiResponse, PaginatedData, User } from '@/types'

export const usersApi = {
  list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<PaginatedData<User>>>('/users', { params }),
  getById: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),
  create: (dto: Partial<User> & { password: string }) => apiClient.post<ApiResponse<User>>('/users', dto),
  update: (id: string, dto: Partial<User>) => apiClient.put<ApiResponse<User>>(`/users/${id}`, dto),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/users/${id}`),
  assignRole: (id: string, role: string) => apiClient.post<ApiResponse<User>>(`/users/${id}/roles`, { role }),
  removeRole: (id: string, role: string) => apiClient.delete<ApiResponse<User>>(`/users/${id}/roles/${role}`),
}
