import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Eye, Edit, Send, Clock } from 'lucide-react'
import { proposalsApi } from '@/api/proposals.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Proposal, Cycle } from '@/types'

const proposalStatusMap: Record<
  Proposal['status'],
  { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'outline' }
> = {
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  SUBMITTED: { label: 'Chờ xét duyệt', variant: 'info' },
  UNDER_REVIEW: { label: 'Đang phản biện', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' },
  REVISION_REQUIRED: { label: 'Yêu cầu chỉnh sửa', variant: 'warning' },
  CONTRACTED: { label: 'Đã ký hợp đồng', variant: 'default' },
  IN_PROGRESS: { label: 'Đang thực hiện', variant: 'info' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  TERMINATED: { label: 'Chấm dứt', variant: 'destructive' },
}

function getCycleName(cycle: Proposal['cycleId']): string {
  if (typeof cycle === 'string') return cycle
  return (cycle as Cycle).name
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  )
}

interface ProposalCardProps {
  proposal: Proposal
  onSubmit: (id: string) => void
  submitting: boolean
}

function ProposalCard({ proposal, onSubmit, submitting }: ProposalCardProps) {
  const navigate = useNavigate()
  const status = proposalStatusMap[proposal.status]
  const isDraft = proposal.status === 'DRAFT'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
        onClick={() => navigate(`/proposals/${proposal._id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{proposal.titleVI}</h3>
              {proposal.titleEN && (
                <p className="text-xs text-muted-foreground italic line-clamp-1 mt-0.5">{proposal.titleEN}</p>
              )}
            </div>
            <Badge variant={status.variant} className="flex-shrink-0 mt-0.5">{status.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 flex-1 flex flex-col">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Kinh phí:</span>
              <span className="font-mono">{formatCurrency(proposal.totalAmount)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Chu kỳ:</span>
              <span>{getCycleName(proposal.cycleId)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {proposal.submittedAt
                  ? `Nộp: ${formatDate(proposal.submittedAt)}`
                  : `Tạo: ${formatDate(proposal.createdAt)}`}
              </span>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2 pt-2 border-t"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => navigate(`/proposals/${proposal._id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
              Xem
            </Button>
            {isDraft && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => navigate(`/proposals/${proposal._id}`)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  loading={submitting}
                  onClick={() => onSubmit(proposal._id)}
                >
                  <Send className="h-3.5 w-3.5" />
                  Nộp đề xuất
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function MyProposalsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['proposals', 'my', page],
    queryFn: () => proposalsApi.myProposals({ page, limit: 12 }),
    staleTime: 30_000,
  })

  const proposals = data?.data?.data?.items ?? []
  const total = data?.data?.data?.total ?? 0
  const totalPages = data?.data?.data?.totalPages ?? 1

  const submitMutation = useMutation({
    mutationFn: (id: string) => proposalsApi.submit(id),
    onSuccess: () => {
      toast.success('Nộp đề xuất thành công', 'Đề xuất đã được gửi để xét duyệt')
      queryClient.invalidateQueries({ queryKey: ['proposals', 'my'] })
    },
    onError: () => toast.error('Không thể nộp đề xuất', 'Vui lòng thử lại'),
  })

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Đề xuất của tôi" />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    )
  }

  const start = total === 0 ? 0 : (page - 1) * 12 + 1
  const end = Math.min(page * 12, total)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đề xuất của tôi"
        description="Quản lý các đề xuất nghiên cứu bạn đã tạo"
        actions={
          <Button onClick={() => navigate('/proposals/create')}>
            <Plus className="h-4 w-4" />
            Tạo đề xuất mới
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          title="Bạn chưa có đề xuất nào"
          description="Tạo đề xuất nghiên cứu đầu tiên của bạn để bắt đầu. Hệ thống sẽ hỗ trợ bạn qua toàn bộ quy trình."
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          action={
            <Button onClick={() => navigate('/proposals/create')}>
              <Plus className="h-4 w-4" />
              Tạo đề xuất đầu tiên
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal._id}
                proposal={proposal}
                onSubmit={(id) => submitMutation.mutate(id)}
                submitting={submitMutation.isPending}
              />
            ))}
          </div>

          {total > 12 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {start}–{end} / {total} đề xuất
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
