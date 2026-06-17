import { PROPOSAL_STATUS_LABELS, CONTRACT_STATUS_LABELS, CYCLE_STATUS_LABELS, DISBURSEMENT_STATUS_LABELS } from '@/constants'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-700 border-orange-200',
  CONTRACTED: 'bg-purple-100 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-teal-100 text-teal-700 border-teal-200',
  TERMINATED: 'bg-gray-100 text-gray-500 border-gray-200',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  RELEASED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  FORMING: 'bg-purple-100 text-purple-700 border-purple-200',
  DISSOLVED: 'bg-gray-100 text-gray-500 border-gray-200',
}

const allLabels = { ...PROPOSAL_STATUS_LABELS, ...CONTRACT_STATUS_LABELS, ...CYCLE_STATUS_LABELS, ...DISBURSEMENT_STATUS_LABELS }

interface StatusBadgeProps { status: string; className?: string }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusColors[status] ?? 'bg-gray-100 text-gray-700', className)}>
      {allLabels[status] ?? status}
    </span>
  )
}
