import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, FileText, ChevronRight } from 'lucide-react'
import { proposalsApi } from '@/api/proposals.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Proposal, Cycle, User } from '@/types'

type StatusFilter = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SUBMITTED', label: 'Chờ xét duyệt' },
  { value: 'UNDER_REVIEW', label: 'Đang phản biện' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
]

const proposalStatusMap: Record<Proposal['status'], { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'outline' }> = {
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

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3"><div className="space-y-1.5"><Skeleton className="h-4 w-52" /><Skeleton className="h-3 w-36" /></div></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-8 w-8 rounded-md" /></td>
    </tr>
  )
}

function getPIName(pi: Proposal['piId']): string {
  if (typeof pi === 'string') return pi
  return (pi as User).fullName
}

function getCycleName(cycle: Proposal['cycleId']): string {
  if (typeof cycle === 'string') return cycle
  return (cycle as Cycle).name
}

export function ProposalsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const queryParams: Record<string, unknown> = { page, limit: 20 }
  if (statusFilter !== 'ALL') queryParams.status = statusFilter
  if (search) queryParams.search = search

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['proposals', page, statusFilter, search],
    queryFn: () => proposalsApi.list(queryParams),
    staleTime: 30_000,
  })

  const proposals = data?.data?.data?.items ?? []
  const total = data?.data?.data?.total ?? 0
  const totalPages = data?.data?.data?.totalPages ?? 1

  const start = total === 0 ? 0 : (page - 1) * 20 + 1
  const end = Math.min(page * 20, total)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tất cả Đề xuất"
        description="Xem và quản lý tất cả đề xuất nghiên cứu trong hệ thống"
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs value={statusFilter} onValueChange={handleTabChange}>
          <TabsList className="h-9">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm theo tên đề tài..."
              className="pl-9 w-64"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Đề tài</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Chủ nhiệm</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Chu kỳ</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kinh phí</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nộp lúc</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-2">
                    <ErrorState onRetry={() => void refetch()} />
                  </td>
                </tr>
              ) : proposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-2">
                    <EmptyState
                      title="Không có đề xuất nào"
                      description="Chưa có đề xuất nào khớp với bộ lọc hiện tại."
                      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                    />
                  </td>
                </tr>
              ) : (
                proposals.map((proposal, i) => {
                  const statusInfo = proposalStatusMap[proposal.status]
                  return (
                    <motion.tr
                      key={proposal._id}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                      onClick={() => navigate(`/proposals/${proposal._id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1 max-w-xs">{proposal.titleVI}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs italic">{proposal.titleEN}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{getPIName(proposal.piId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getCycleName(proposal.cycleId)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{formatCurrency(proposal.totalAmount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {proposal.submittedAt ? formatDate(proposal.submittedAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !isError && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
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
      </div>
    </div>
  )
}
