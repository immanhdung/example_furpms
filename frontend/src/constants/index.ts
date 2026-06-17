export const ROLES = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  FACULTY: 'Faculty',
  REVIEW_COMMITTEE: 'ReviewCommittee',
} as const

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  REVISION_REQUIRED: 'Cần chỉnh sửa',
  CONTRACTED: 'Đã ký hợp đồng',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  TERMINATED: 'Đã chấm dứt',
}

export const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-700',
  CONTRACTED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-teal-100 text-teal-700',
  TERMINATED: 'bg-gray-100 text-gray-500',
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang hiệu lực',
  SUSPENDED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  TERMINATED: 'Chấm dứt',
}

export const CYCLE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  COMPLETED: 'Hoàn thành',
}

export const DISBURSEMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ giải ngân',
  RELEASED: 'Đã giải ngân',
  CANCELLED: 'Đã hủy',
}
