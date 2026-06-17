import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ReceiptText,
  Plus,
  CheckCircle2,
  Clock,
  FileCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
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
import { contractsApi } from '@/api/contracts.api'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { ApiResponse, Contract, Settlement } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
}

const STATUS_ICON: Record<string, React.ElementType> = {
  DRAFT: Clock,
  SUBMITTED: FileCheck,
  APPROVED: CheckCircle2,
}

const WORKFLOW_STEPS = ['DRAFT', 'SUBMITTED', 'APPROVED']

function SettlementStatusBadge({ status }: { status: string }) {
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

interface SettlementWithContract extends Omit<Settlement, 'contractId'> {
  contractId: Contract | string
}

function WorkflowBadge({ status }: { status: string }) {
  const currentIndex = WORKFLOW_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              i <= currentIndex ? 'bg-indigo-500' : 'bg-muted',
            )}
          />
          {i < WORKFLOW_STEPS.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-4 rounded transition-colors',
                i < currentIndex ? 'bg-indigo-500' : 'bg-muted',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CreateSettlementDialog({
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
    totalDisbursed: '',
    totalExpense: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      contractsApi.createSettlement(form.contractId, {
        totalDisbursed: parseFloat(form.totalDisbursed),
        totalExpense: parseFloat(form.totalExpense),
        notes: form.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      onOpenChange(false)
      setForm({ contractId: '', totalDisbursed: '', totalExpense: '', notes: '' })
      setError('')
    },
    onError: () => setError('Không thể tạo quyết toán. Vui lòng thử lại.'),
  })

  const surplus =
    form.totalDisbursed && form.totalExpense
      ? parseFloat(form.totalDisbursed) - parseFloat(form.totalExpense)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo Quyết toán Hợp đồng</DialogTitle>
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="csContract">Hợp đồng</Label>
            <select
              id="csContract"
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
              <Label htmlFor="csTotalDisbursed">Tổng giải ngân (VND)</Label>
              <Input
                id="csTotalDisbursed"
                type="number"
                placeholder="0"
                value={form.totalDisbursed}
                onChange={(e) => setForm((f) => ({ ...f, totalDisbursed: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csTotalExpense">Tổng chi tiêu (VND)</Label>
              <Input
                id="csTotalExpense"
                type="number"
                placeholder="0"
                value={form.totalExpense}
                onChange={(e) => setForm((f) => ({ ...f, totalExpense: e.target.value }))}
              />
            </div>
          </div>
          {surplus !== null && (
            <div
              className={cn(
                'flex items-center justify-between rounded-xl p-3.5 border',
                surplus >= 0
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20',
              )}
            >
              <span className="text-sm font-medium">Số dư / Bội chi</span>
              <div className="flex items-center gap-1.5">
                {surplus >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-bold',
                    surplus >= 0 ? 'text-green-700' : 'text-red-700',
                  )}
                >
                  {formatCurrency(Math.abs(surplus))}
                </span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="csNotes">Ghi chú</Label>
            <Textarea
              id="csNotes"
              placeholder="Ghi chú về quá trình quyết toán..."
              rows={2}
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
            disabled={!form.contractId || !form.totalDisbursed || !form.totalExpense || mutation.isPending}
          >
            {mutation.isPending ? 'Đang tạo...' : 'Tạo Quyết toán'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b">
          <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SettlementsPage() {
  const [showCreate, setShowCreate] = useState(false)

  const contractsQuery = useQuery({
    queryKey: ['contracts', 'settlements-page'],
    queryFn: () => contractsApi.list({ limit: 100 }).then((r) => r.data.data),
    staleTime: 120_000,
  })

  const contracts = contractsQuery.data?.items ?? []

  // Fetch settlements for each contract
  const settlementsQuery = useQuery({
    queryKey: ['settlements', contracts.map((c) => c._id).join(',')],
    queryFn: async () => {
      if (contracts.length === 0) return []
      const results = await Promise.all(
        contracts.map((c) =>
          contractsApi
            .getSettlement(c._id)
            .then((r) => {
              const s = r.data.data
              return s ? ({ ...s, contractId: c } as SettlementWithContract) : null
            })
            .catch(() => null),
        ),
      )
      return results.filter((s): s is SettlementWithContract => s !== null)
    },
    enabled: contracts.length > 0,
    staleTime: 60_000,
  })

  const settlements = settlementsQuery.data ?? []
  const isLoading = contractsQuery.isLoading || settlementsQuery.isLoading

  // Summary stats
  const totalDisbursed = settlements.reduce((s, x) => s + x.totalDisbursed, 0)
  const totalExpense = settlements.reduce((s, x) => s + x.totalExpense, 0)
  const totalSurplus = totalDisbursed - totalExpense
  const approvedCount = settlements.filter((s) => s.status === 'APPROVED').length

  const summaryCards = [
    {
      label: 'Tổng giải ngân',
      value: formatCurrency(totalDisbursed),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    },
    {
      label: 'Tổng chi tiêu',
      value: formatCurrency(totalExpense),
      icon: ReceiptText,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-950/40',
    },
    {
      label: 'Số dư / Bội chi',
      value: formatCurrency(Math.abs(totalSurplus)),
      icon: totalSurplus >= 0 ? ArrowUpRight : ArrowDownRight,
      color: totalSurplus >= 0 ? 'text-green-600' : 'text-red-600',
      bg: totalSurplus >= 0
        ? 'bg-green-100 dark:bg-green-950/40'
        : 'bg-red-100 dark:bg-red-950/40',
    },
    {
      label: 'Đã duyệt',
      value: `${approvedCount} quyết toán`,
      icon: CheckCircle2,
      color: 'text-teal-600',
      bg: 'bg-teal-100 dark:bg-teal-950/40',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Quyết toán Hợp đồng"
          description="Quản lý quyết toán tài chính và nghiệm thu kinh phí nghiên cứu"
          actions={
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo Quyết toán
            </Button>
          }
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
                    <p className="text-sm font-bold leading-tight truncate">
                      {isLoading ? '—' : s.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="py-3.5 px-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-indigo-600" />
              Danh sách Quyết toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : settlements.length === 0 ? (
              <EmptyState
                title="Chưa có quyết toán"
                description="Tạo quyết toán đầu tiên để bắt đầu quá trình nghiệm thu tài chính."
                icon={<ReceiptText className="h-8 w-8 text-muted-foreground" />}
                action={
                  <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo Quyết toán
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/10">
                      {[
                        'Hợp đồng',
                        'Tổng giải ngân',
                        'Tổng chi tiêu',
                        'Số dư',
                        'Tiến trình',
                        'Trạng thái',
                        'Ngày tạo',
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
                    {settlements.map((settlement, i) => {
                      const contract =
                        typeof settlement.contractId === 'object'
                          ? settlement.contractId
                          : null
                      const surplusPositive = settlement.surplus >= 0

                      return (
                        <motion.tr
                          key={settlement._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                                <ReceiptText className="h-3.5 w-3.5 text-indigo-600" />
                              </div>
                              <span className="text-sm font-medium">
                                {contract?.contractNumber ??
                                  (settlement.contractId as string)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                            {formatCurrency(settlement.totalDisbursed)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground whitespace-nowrap">
                            {formatCurrency(settlement.totalExpense)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {surplusPositive ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                              )}
                              <span
                                className={cn(
                                  'text-sm font-bold',
                                  surplusPositive ? 'text-green-700' : 'text-red-700',
                                )}
                              >
                                {formatCurrency(Math.abs(settlement.surplus))}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <WorkflowBadge status={settlement.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            <SettlementStatusBadge status={settlement.status} />
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(settlement.createdAt)}
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

      <CreateSettlementDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        contracts={contracts}
      />
    </div>
  )
}
