import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ApiResponse, PaginatedData, Contract } from '@/types'

interface ProgressReport {
  _id: string
  contractId: string | Contract
  reportingPeriodStart: string
  reportingPeriodEnd: string
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  notes?: string
  fileUrl?: string
  submittedAt?: string
  createdAt: string
}

const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT: Clock,
  SUBMITTED: Upload,
  REVIEWED: FileText,
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
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      ))}
    </div>
  )
}

function SubmitReportDialog({
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
    reportingPeriodStart: '',
    reportingPeriodEnd: '',
    notes: '',
    fileUrl: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<ProgressReport>>(
        `/contracts/${form.contractId}/progress-reports`,
        form,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-reports'] })
      onOpenChange(false)
      setForm({
        contractId: '',
        reportingPeriodStart: '',
        reportingPeriodEnd: '',
        notes: '',
        fileUrl: '',
      })
      setError('')
    },
    onError: () => setError('Không thể nộp báo cáo. Vui lòng thử lại.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nộp Báo cáo Tiến độ</DialogTitle>
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="srContract">Hợp đồng</Label>
            <select
              id="srContract"
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="srPeriodStart">Từ ngày</Label>
              <Input
                id="srPeriodStart"
                type="date"
                value={form.reportingPeriodStart}
                onChange={(e) => setForm((f) => ({ ...f, reportingPeriodStart: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="srPeriodEnd">Đến ngày</Label>
              <Input
                id="srPeriodEnd"
                type="date"
                value={form.reportingPeriodEnd}
                onChange={(e) => setForm((f) => ({ ...f, reportingPeriodEnd: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="srFileUrl">Đường dẫn file báo cáo</Label>
            <Input
              id="srFileUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="srNotes">Ghi chú</Label>
            <Textarea
              id="srNotes"
              placeholder="Mô tả tiến độ trong kỳ báo cáo..."
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
            disabled={
              !form.contractId || !form.reportingPeriodStart || !form.reportingPeriodEnd || mutation.isPending
            }
          >
            {mutation.isPending ? 'Đang nộp...' : 'Nộp báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReportStatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICON[status] ?? FileText
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

export function ProgressReportsPage() {
  const { isAdmin, isStaff, isFaculty } = useAuthStore()
  const isAdminOrStaff = isAdmin() || isStaff()
  const [showSubmit, setShowSubmit] = useState(false)

  const reportsQuery = useQuery({
    queryKey: ['progress-reports'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedData<ProgressReport>>>('/progress-reports')
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

  const getContractNumber = (report: ProgressReport) => {
    const c = report.contractId as Contract | string
    return typeof c === 'object' ? c.contractNumber : c
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Báo cáo Tiến độ"
          description={
            isAdminOrStaff
              ? 'Xem và quản lý tất cả báo cáo tiến độ nghiên cứu'
              : 'Nộp và theo dõi báo cáo tiến độ thực hiện đề tài'
          }
          actions={
            isFaculty() ? (
              <Button onClick={() => setShowSubmit(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nộp báo cáo
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
              icon: FileText,
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
              label: 'Từ chối',
              count: reports.filter((r) => r.status === 'REJECTED').length,
              icon: XCircle,
              color: 'text-red-600',
              bg: 'bg-red-100',
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
                    <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4.5 w-4.5 ${s.color}`} />
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
              <FileText className="h-4 w-4 text-indigo-600" />
              Danh sách Báo cáo Tiến độ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : reports.length === 0 ? (
              <EmptyState
                title="Chưa có báo cáo tiến độ"
                description={
                  isFaculty()
                    ? 'Nộp báo cáo tiến độ đầu tiên để cập nhật tình hình thực hiện đề tài.'
                    : 'Chưa có báo cáo tiến độ nào trong hệ thống.'
                }
                icon={<FileText className="h-8 w-8 text-muted-foreground" />}
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
                        'Kỳ báo cáo',
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
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium">
                              {getContractNumber(report)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                          {report.reportingPeriodStart && report.reportingPeriodEnd
                            ? `${formatDate(report.reportingPeriodStart)} — ${formatDate(report.reportingPeriodEnd)}`
                            : '—'}
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
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
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

      <SubmitReportDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        contracts={contracts}
      />
    </div>
  )
}
