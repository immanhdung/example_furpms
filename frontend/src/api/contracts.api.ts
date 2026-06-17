import apiClient from './client'
import type { ApiResponse, PaginatedData, Contract, Disbursement, Deliverable, Amendment, Settlement } from '@/types'

export const contractsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<PaginatedData<Contract>>>('/contracts', { params }),
  getById: (id: string) => apiClient.get<ApiResponse<Contract>>(`/contracts/${id}`),
  create: (dto: Partial<Contract>) => apiClient.post<ApiResponse<Contract>>('/contracts', dto),
  sign: (id: string) => apiClient.post<ApiResponse<Contract>>(`/contracts/${id}/sign`),
  getDisbursements: (contractId: string) => apiClient.get<ApiResponse<Disbursement[]>>(`/contracts/${contractId}/disbursements`),
  generateDisbursements: (contractId: string) => apiClient.post<ApiResponse<Disbursement[]>>(`/contracts/${contractId}/disbursements/generate`),
  getDeliverables: (contractId: string) => apiClient.get<ApiResponse<Deliverable[]>>(`/contracts/${contractId}/deliverables`),
  getAmendments: (contractId: string) => apiClient.get<ApiResponse<Amendment[]>>(`/contracts/${contractId}/amendments`),
  createAmendment: (contractId: string, dto: Partial<Amendment>) =>
    apiClient.post<ApiResponse<Amendment>>(`/contracts/${contractId}/amendments`, dto),
  getSettlement: (contractId: string) => apiClient.get<ApiResponse<Settlement>>(`/contracts/${contractId}/settlement`),
  createSettlement: (contractId: string, dto: Partial<Settlement>) =>
    apiClient.post<ApiResponse<Settlement>>(`/contracts/${contractId}/settlement`, dto),
}
