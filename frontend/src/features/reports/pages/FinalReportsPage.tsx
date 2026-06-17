import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Upload,
  Clock,
  Star,
  BookMarked,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import apiClient from '@/api/client'
import { contractsApi } from '@/api/contracts.api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'
import type { ApiResponse, PaginatedData, Contract } from '@/types'

interface FinalReport {
  _id: string
  contractId: string | Contract
  achievement: string
  publications?: string
  selfAssessment?: string
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  fileUrl?: string
  submittedAt?: string
  createdAt: string
}

const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT: Clock,
  SUBMITTED: Upload,
  REVIEWED: BookOpen,
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  REVIEWED: 'Đang xem xét',
  ACCEPTED: 'Chấp thuận',
  REJECTED: 'Từ chối',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  REVIEWED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b">
          <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  )
}

function ReportStatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICON[status] ?? BookOpen
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function SubmitFinalReportDialog({
  open,
  onOpenChange,
  contracts,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contracts: Contract[]
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    contractId: '',
    achievement: '',
    publications: '',
    selfAssessment: '',
    fileUrl: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<FinalReport>>(
        `/contracts/${form.contractId}/final-reports`,
        form,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-reports'] })
      onOpenChange(false)
      setForm({
        contractId: '',
        achievement: '',
        publications: '',
        selfAssessment: '',
        fileUrl: '',
      })
      setError('')
    },
    onError: () => setError('Không thể nộp báo cáo tổng kết. Vui lòng thử lại.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nộp Báo cáo Tổng kết</DialogTitle>
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="frContract">Hợp đồng</Label>
            <select
              id="frContract"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.contractId}
              onChange={(e) => setForm((f) => ({ ...f, contractId: e.target.value }))}
            >
              <option value="">-- Chọn hợp đồng --</option>
              {contracts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.contractNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frAchievement">Kết quả đạt được</Label>
            <Textarea
              id="frAchievement"
              placeholder="Mô tả các kết quả nghiên cứu đã đạt được..."
              rows={3}
              value={form.achievement}
              onChange={(e) => setForm((f) => ({ ...f, achievement: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frPublications">Công bố khoa học</Label>
            <Textarea
              id="frPublications"
              placeholder="Liệt kê các bài báo, hội nghị đã công bố (nếu có)..."
              rows={2}
              value={form.publications}
              onChange={(e) => setForm((f) => ({ ...f, publications: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frSelfAssessment">Tự đánh giá</Label>
            <Textarea
              id="frSelfAssessment"
              placeholder="Đánh giá mức độ hoàn thành so với mục tiêu đề ra..."
              rows={2}
              value={form.selfAssessment}
              onChange={(e) => setForm((f) => ({ ...f, selfAssessment: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frFileUrl">Đường dẫn file báo cáo</Label>
            <Input
              id="frFileUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.contractId || !form.achievement || mutation.isPending}
          >
            {mutation.isPending ? 'Đang nộp...' : 'Nộp báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FinalReportsPage() {
  const { isAdmin, isStaff, isFaculty } = useAuthStore()
  const isAdminOrStaff = isAdmin() || isStaff()
  const [showSubmit, setShowSubmit] = useState(false)

  const reportsQuery = useQuery({
    queryKey: ['final-reports'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedData<FinalReport>>>('/final-reports')
        .then((r) => r.data.data),
    staleTime: 60_000,
  })

  const contractsQuery = useQuery({
    queryKey: ['contracts', 'my'],
    queryFn: () => contractsApi.list().then((r) => r.data.data),
    enabled: isFaculty(),
    staleTime: 120_000,
  })

  const reports = reportsQuery.data?.items ?? []
  const contracts = contractsQuery.data?.items ?? []
  const isLoading = reportsQuery.isLoading

  const getContractNumber = (report: FinalReport) => {
    const c = report.contractId as Contract | string
    return typeof c === 'object' ? c.contractNumber : c
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Báo cáo Tổng kết"
          description={
            isAdminOrStaff
              ? 'Xem và quản lý tất cả báo cáo tổng kết đề tài nghiên cứu'
              : 'Nộp và theo dõi báo cáo tổng kết thực hiện đề tài'
          }
          actions={
            isFaculty() ? (
              <Button onClick={() => setShowSubmit(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nộp báo cáo tổng kết
              </Button>
            ) : undefined
          }
        />
      </motion.div>

      {/* Summary cards */}
      {!isLoading && reports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            {
              label: 'Tất cả',
              count: reports.length,
              icon: BookOpen,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
            },
            {
              label: 'Đã nộp',
              count: reports.filter((r) => r.status === 'SUBMITTED').length,
              icon: Upload,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
            {
              label: 'Chấp thuận',
              count: reports.filter((r) => r.status === 'ACCEPTED').length,
              icon: CheckCircle2,
              color: 'text-green-600',
              bg: 'bg-green-100',
            },
            {
              label: 'Có công bố',
              count: reports.filter((r) => !!r.publications).length,
              icon: BookMarked,
              color: 'text-purple-600',
              bg: 'bg-purple-100',
            },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold leading-none">{s.count}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="py-3.5 px-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              Danh sách Báo cáo Tổng kết
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : reports.length === 0 ? (
              <EmptyState
                title="Chưa có báo cáo tổng kết"
                description={
                  isFaculty()
                    ? 'Nộp báo cáo tổng kết để hoàn thành chu kỳ nghiên cứu của bạn.'
                    : 'Chưa có báo cáo tổng kết nào trong hệ thống.'
                }
                icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
                action={
                  isFaculty() ? (
                    <Button onClick={() => setShowSubmit(true)} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nộp báo cáo đầu tiên
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/10">
                      {[
                        'Hợp đồng',
                        'Kết quả đạt được',
                        'Công bố',
                        'Trạng thái',
                        'Ngày nộp',
                        'File',
                      ].map((th) => (
                        <th
                          key={th}
                          className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        >
                          {th}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, i) => (
                      <motion.tr
                        key={report._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium">
                              {getContractNumber(report)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-foreground line-clamp-2 max-w-[200px]">
                            {report.achievement}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          {report.publications ? (
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[140px]">
                                {report.publications}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportStatusBadge status={report.status} />
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                          {report.submittedAt ? formatDate(report.submittedAt) : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          {report.fileUrl ? (
                            <a
                              href={report.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Xem file
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <SubmitFinalReportDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        contracts={contracts}
      />
    </div>
  )
}
