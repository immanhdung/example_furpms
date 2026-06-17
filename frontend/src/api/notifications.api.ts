import apiClient from './client'
import type { ApiResponse, PaginatedData, Notification } from '@/types'

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<PaginatedData<Notification>>>('/notifications', { params }),
  markRead: (id: string) => apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<ApiResponse<null>>('/notifications/read-all'),
  unreadCount: () => apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
}
