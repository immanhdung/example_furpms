import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Banknote,
  Filter,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import apiClient from '@/api/client'
import { contractsApi } from '@/api/contracts.api'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { ApiResponse, PaginatedData, Contract, Disbursement } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ giải ngân',
  RELEASED: 'Đã giải ngân',
  CANCELLED: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  RELEASED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Clock,
  RELEASED: CheckCircle2,
  CANCELLED: XCircle,
}

function DisbursementStatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICON[status] ?? Clock
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      <Icon className="h-3 w-3" />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

interface DisbursementWithContract extends Omit<Disbursement, 'contractId'> {
  contractId: Contract | string
}

function ReleaseDisbursementDialog({
  open,
  onOpenChange,
  disbursement,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  disbursement: DisbursementWithContract | null
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ actualAmount: '', actualDate: '' })
  const [error, setError] = useState('')

  const contractId =
    disbursement
      ? typeof disbursement.contractId === 'object'
        ? disbursement.contractId._id
        : disbursement.contractId
      : ''

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch<ApiResponse<Disbursement>>(
        `/contracts/${contractId}/disbursements/${disbursement?._id}/release`,
        {
          actualAmount: parseFloat(form.actualAmount),
          actualDate: form.actualDate,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements'] })
      onOpenChange(false)
      setForm({ actualAmount: '', actualDate: '' })
      setError('')
    },
    onError: () => setError('Không thể thực hiện giải ngân. Vui lòng thử lại.'),
  })

  const contractNumber =
    disbursement
      ? typeof disbursement.contractId === 'object'
        ? (disbursement.contractId as Contract).contractNumber
        : disbursement.contractId
      : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thực hiện Giải ngân</DialogTitle>
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />
        {disbursement && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hợp đồng</span>
                <span className="font-semibold">{contractNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đợt giải ngân</span>
                <span className="font-semibold">#{disbursement.installmentNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Số tiền kế hoạch</span>
                <span className="font-bold text-indigo-600">
                  {formatCurrency(disbursement.plannedAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ngày dự kiến</span>
                <span className="font-medium">{formatDate(disbursement.plannedDate)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rdActualAmount">Số tiền thực tế (VND)</Label>
              <Input
                id="rdActualAmount"
                type="number"
                placeholder="Nhập số tiền giải ngân thực tế..."
                value={form.actualAmount}
                onChange={(e) => setForm((f) => ({ ...f, actualAmount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rdActualDate">Ngày giải ngân thực tế</Label>
              <Input
                id="rdActualDate"
                type="date"
                value={form.actualDate}
                onChange={(e) => setForm((f) => ({ ...f, actualDate: e.target.value }))}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.actualAmount || !form.actualDate || mutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {mutation.isPending ? 'Đang xử lý...' : 'Xác nhận Giải ngân'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-5 w-8 rounded" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function DisbursementsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedDisbursement, setSelectedDisbursement] =
    useState<DisbursementWithContract | null>(null)
  const [showRelease, setShowRelease] = useState(false)

  // Fetch all contracts, then their disbursements
  const contractsQuery = useQuery({
    queryKey: ['contracts', 'all'],
    queryFn: () => contractsApi.list({ limit: 100 }).then((r) => r.data.data),
    staleTime: 120_000,
  })

  const contracts = contractsQuery.data?.items ?? []

  // Fetch disbursements for all contracts in parallel
  const disbursementsQueries = useQuery({
    queryKey: ['disbursements', contracts.map((c) => c._id).join(',')],
    queryFn: async () => {
      if (contracts.length === 0) return []
      const results = await Promise.all(
        contracts.map((c) =>
          contractsApi
            .getDisbursements(c._id)
            .then((r) =>
              (r.data.data as Disbursement[]).map((d) => ({ ...d, contractId: c })),
            )
            .catch(() => [] as DisbursementWithContract[]),
        ),
      )
      return results.flat() as DisbursementWithContract[]
    },
    enabled: contracts.length > 0,
    staleTime: 60_000,
  })

  const allDisbursements = (disbursementsQueries.data ?? []) as DisbursementWithContract[]

  const filtered =
    statusFilter === 'ALL'
      ? allDisbursements
      : allDisbursements.filter((d) => d.status === statusFilter)

  const isLoading = contractsQuery.isLoading || disbursementsQueries.isLoading

  // Summary stats
  const totalPlanned = allDisbursements.reduce((s, d) => s + d.plannedAmount, 0)
  const totalReleased = allDisbursements
    .filter((d) => d.status === 'RELEASED')
    .reduce((s, d) => s + (d.actualAmount ?? d.plannedAmount), 0)
  const pendingCount = allDisbursements.filter((d) => d.status === 'PENDING').length

  const summaryCards = [
    {
      label: 'Tổng kế hoạch',
      value: formatCurrency(totalPlanned),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    },
    {
      label: 'Đã giải ngân',
      value: formatCurrency(totalReleased),
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-950/40',
    },
    {
      label: 'Chờ giải ngân',
      value: `${pendingCount} đợt`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-950/40',
    },
    {
      label: 'Tổng đợt',
      value: `${allDisbursements.length}`,
      icon: Banknote,
      color: 'text-gray-600',
      bg: 'bg-gray-100 dark:bg-gray-800',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Quản lý Giải ngân"
          description="Theo dõi và thực hiện các đợt giải ngân theo kế hoạch hợp đồng nghiên cứu"
        />
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold leading-tight truncate">{isLoading ? '—' : s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Filter + table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="py-3.5 px-5 border-b bg-muted/20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Danh sách Đợt Giải ngân
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Select
                  className="h-8 text-xs w-36"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ giải ngân</option>
                  <option value="RELEASED">Đã giải ngân</option>
                  <option value="CANCELLED">Đã hủy</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Không có dữ liệu giải ngân"
                description={
                  statusFilter !== 'ALL'
                    ? `Không có đợt giải ngân nào ở trạng thái "${STATUS_LABELS[statusFilter]}".`
                    : 'Chưa có đợt giải ngân nào được tạo.'
                }
                icon={<Banknote className="h-8 w-8 text-muted-foreground" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/10">
                      {[
                        'Hợp đồng',
                        'Đợt',
                        'Số tiền KH',
                        'Số tiền TT',
                        'Ngày dự kiến',
                        'Trạng thái',
                        '',
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
                    {filtered.map((disbursement, i) => {
                      const contract =
                        typeof disbursement.contractId === 'object'
                          ? disbursement.contractId
                          : null
                      return (
                        <motion.tr
                          key={disbursement._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">
                                {contract?.contractNumber ?? (disbursement.contractId as string)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                              {disbursement.installmentNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                            {formatCurrency(disbursement.plannedAmount)}
                          </td>
                          <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                            {disbursement.actualAmount ? (
                              <span className="font-semibold text-green-700">
                                {formatCurrency(disbursement.actualAmount)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(disbursement.plannedDate)}
                            {disbursement.actualDate && (
                              <div className="text-xs text-green-600">
                                TT: {formatDate(disbursement.actualDate)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <DisbursementStatusBadge status={disbursement.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            {disbursement.status === 'PENDING' && (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedDisbursement(disbursement)
                                  setShowRelease(true)
                                }}
                              >
                                <Banknote className="h-3 w-3" />
                                Giải ngân
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ReleaseDisbursementDialog
        open={showRelease}
        onOpenChange={setShowRelease}
        disbursement={selectedDisbursement}
      />
    </div>
  )
}
