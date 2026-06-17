import apiClient from './client'
import type { ApiResponse, User } from '@/types'

export interface LoginDto { email: string; password: string }
export interface RegisterDto { fullName: string; email: string; password: string; roles?: string[] }

export const authApi = {
  login: (dto: LoginDto) => apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', dto),
  register: (dto: RegisterDto) => apiClient.post<ApiResponse<User>>('/auth/register', dto),
  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),
  refresh: (refreshToken: string) => apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }),
}
