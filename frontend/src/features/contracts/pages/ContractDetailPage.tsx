import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileSignature,
  Calendar,
  DollarSign,
  CheckCircle,
  ClipboardList,
  Banknote,
  FilePen,
  Calculator,
  Zap,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { contractsApi } from '@/api/contracts.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DISBURSEMENT_STATUS_LABELS } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'
import type { Contract, Proposal, Disbursement, Deliverable, Amendment, Settlement } from '@/types'

function getProposalTitle(proposal: Contract['proposalId']): string {
  if (typeof proposal === 'string') return proposal
  return (proposal as Proposal).titleVI
}

// ────────────────────────────────────────────
// Skeleton for detail page
// ────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-7 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-36" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

// ────────────────────────────────────────────
// Disbursements tab
// ────────────────────────────────────────────
function DisbursementsTab({ contractId }: { contractId: string }) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['disbursements', contractId],
    queryFn: () => contractsApi.getDisbursements(contractId),
    staleTime: 30_000,
  })

  const generateMutation = useMutation({
    mutationFn: () => contractsApi.generateDisbursements(contractId),
    onSuccess: () => {
      toast.success('Tạo lịch giải ngân thành công')
      void queryClient.invalidateQueries({ queryKey: ['disbursements', contractId] })
    },
    onError: () => {
      toast.error('Tạo lịch giải ngân thất bại')
    },
  })

  const disbursements: Disbursement[] = data?.data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  if (disbursements.length === 0) {
    return (
      <EmptyState
        title="Chưa có lịch giải ngân"
        description="Nhấn 'Tạo lịch giải ngân' để hệ thống tự động tạo kế hoạch giải ngân theo hợp đồng."
        icon={<Banknote className="h-8 w-8 text-muted-foreground" />}
        action={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Zap className="h-4 w-4" />
            {generateMutation.isPending ? 'Đang tạo...' : 'Tạo lịch giải ngân'}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {disbursements.map((d, i) => (
        <motion.div
          key={d._id}
          className="flex items-center justify-between rounded-lg border bg-card p-4"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {d.installmentNumber}
            </div>
            <div>
              <p className="font-medium text-foreground">{formatCurrency(d.plannedAmount)}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                Dự kiến: {formatDate(d.plannedDate)}
                {d.actualDate && (
                  <span className="ml-2 text-green-600">
                    · Thực tế: {formatDate(d.actualDate)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={d.status} />
            {d.status === 'PENDING' && (
              <ReleaseDisbursementButton disbursementId={d._id} contractId={contractId} />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ReleaseDisbursementButton({ disbursementId, contractId }: { disbursementId: string; contractId: string }) {
  const queryClient = useQueryClient()

  const releaseMutation = useMutation({
    mutationFn: () =>
      contractsApi.getDisbursements(contractId).then(() =>
        fetch(`/api/contracts/${contractId}/disbursements/${disbursementId}/release`, { method: 'POST' }),
      ),
    onSuccess: () => {
      toast.success('Giải ngân thành công')
      void queryClient.invalidateQueries({ queryKey: ['disbursements', contractId] })
    },
    onError: () => {
      toast.error('Giải ngân thất bại')
    },
  })

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
      onClick={() => releaseMutation.mutate()}
      disabled={releaseMutation.isPending}
    >
      <CheckCircle className="h-3.5 w-3.5" />
      {releaseMutation.isPending ? 'Đang xử lý...' : 'Giải ngân'}
    </Button>
  )
}

// ────────────────────────────────────────────
// Deliverables tab
// ────────────────────────────────────────────
const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ nộp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
}

function DeliverablesTab({ contractId }: { contractId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['deliverables', contractId],
    queryFn: () => contractsApi.getDeliverables(contractId),
    staleTime: 30_000,
  })

  const deliverables: Deliverable[] = data?.data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  if (deliverables.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm nào"
        description="Chưa có sản phẩm nghiên cứu được đăng ký cho hợp đồng này."
        icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
      />
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {deliverables.map((d, i) => (
        <motion.div
          key={d._id}
          className="rounded-lg border bg-card p-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex-shrink-0 mt-0.5">
                {d.sequence}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{d.title}</p>
                {d.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Hạn nộp: {formatDate(d.dueDate)}
                  {d.submittedAt && (
                    <span className="ml-2 text-green-600">· Nộp lúc: {formatDate(d.submittedAt)}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={d.status} />
              {d.fileUrl && (
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem file
                </a>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────
// Amendments tab
// ────────────────────────────────────────────
interface AmendmentForm {
  changeDescription: string
  justification: string
  requiresRectorApproval: boolean
}

function AmendmentsTab({ contractId }: { contractId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AmendmentForm>({
    changeDescription: '',
    justification: '',
    requiresRectorApproval: false,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['amendments', contractId],
    queryFn: () => contractsApi.getAmendments(contractId),
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: (dto: Partial<Amendment>) => contractsApi.createAmendment(contractId, dto),
    onSuccess: () => {
      toast.success('Tạo điều chỉnh thành công')
      void queryClient.invalidateQueries({ queryKey: ['amendments', contractId] })
      setShowForm(false)
      setForm({ changeDescription: '', justification: '', requiresRectorApproval: false })
    },
    onError: () => {
      toast.error('Tạo điều chỉnh thất bại')
    },
  })

  const amendments: Amendment[] = data?.data?.data ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.changeDescription.trim() || !form.justification.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    createMutation.mutate(form)
  }

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-4 mt-4">
      {amendments.length === 0 && !showForm && (
        <EmptyState
          title="Chưa có điều chỉnh nào"
          description="Chưa có yêu cầu điều chỉnh hợp đồng nào được ghi nhận."
          icon={<FilePen className="h-8 w-8 text-muted-foreground" />}
          action={
            <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
              Tạo điều chỉnh
            </Button>
          }
        />
      )}

      {amendments.map((a, i) => (
        <motion.div
          key={a._id}
          className="rounded-lg border bg-card p-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground text-sm">Nội dung điều chỉnh</p>
                {a.requiresRectorApproval && (
                  <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    Cần Hiệu trưởng duyệt
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">{a.changeDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Lý do: </span>
                {a.justification}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ngày tạo: {formatDate(a.createdAt)}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        </motion.div>
      ))}

      {amendments.length > 0 && !showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <FilePen className="h-4 w-4" />
          Tạo điều chỉnh mới
        </Button>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-muted/30 p-4"
        >
          <h4 className="font-semibold text-sm mb-3">Tạo yêu cầu điều chỉnh</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="changeDescription">Nội dung điều chỉnh *</Label>
              <Textarea
                id="changeDescription"
                placeholder="Mô tả chi tiết nội dung cần điều chỉnh..."
                value={form.changeDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, changeDescription: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="justification">Lý do / Căn cứ *</Label>
              <Textarea
                id="justification"
                placeholder="Nêu rõ lý do và căn cứ pháp lý của điều chỉnh..."
                value={form.justification}
                onChange={(e) => setForm((prev) => ({ ...prev, justification: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresRectorApproval"
                checked={form.requiresRectorApproval}
                onChange={(e) => setForm((prev) => ({ ...prev, requiresRectorApproval: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="requiresRectorApproval" className="font-normal cursor-pointer">
                Cần phê duyệt của Hiệu trưởng
              </Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// Settlement tab
// ────────────────────────────────────────────
interface SettlementForm {
  totalDisbursed: string
  totalExpense: string
  notes: string
}

function SettlementTab({ contractId }: { contractId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SettlementForm>({
    totalDisbursed: '',
    totalExpense: '',
    notes: '',
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settlement', contractId],
    queryFn: () => contractsApi.getSettlement(contractId),
    staleTime: 30_000,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: (dto: Partial<Settlement>) => contractsApi.createSettlement(contractId, dto),
    onSuccess: () => {
      toast.success('Tạo quyết toán thành công')
      void queryClient.invalidateQueries({ queryKey: ['settlement', contractId] })
      setShowForm(false)
    },
    onError: () => {
      toast.error('Tạo quyết toán thất bại')
    },
  })

  const settlement: Settlement | null = data?.data?.data ?? null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const totalDisbursed = parseFloat(form.totalDisbursed)
    const totalExpense = parseFloat(form.totalExpense)
    if (isNaN(totalDisbursed) || isNaN(totalExpense)) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }
    createMutation.mutate({
      totalDisbursed,
      totalExpense,
      surplus: totalDisbursed - totalExpense,
      notes: form.notes || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (isError && !settlement) {
    // no settlement yet — show create form option
  }

  if (settlement) {
    return (
      <motion.div
        className="mt-4 rounded-lg border bg-card p-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Thông tin quyết toán</h4>
          </div>
          <StatusBadge status={settlement.status} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">Tổng đã giải ngân</p>
            <p className="font-bold text-blue-800">{formatCurrency(settlement.totalDisbursed)}</p>
          </div>
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
            <p className="text-xs text-orange-600 font-medium mb-1">Tổng chi thực tế</p>
            <p className="font-bold text-orange-800">{formatCurrency(settlement.totalExpense)}</p>
          </div>
          <div className={`rounded-lg border p-3 ${settlement.surplus >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-medium mb-1 ${settlement.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {settlement.surplus >= 0 ? 'Kinh phí dư' : 'Kinh phí thiếu'}
            </p>
            <p className={`font-bold ${settlement.surplus >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatCurrency(Math.abs(settlement.surplus))}
            </p>
          </div>
        </div>
        {settlement.notes && (
          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Ghi chú</p>
            <p className="text-sm text-foreground">{settlement.notes}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Ngày tạo: {formatDate(settlement.createdAt)}
        </p>
      </motion.div>
    )
  }

  return (
    <div className="mt-4">
      {!showForm ? (
        <EmptyState
          title="Chưa có quyết toán"
          description="Tạo quyết toán để tổng kết tình hình tài chính của hợp đồng sau khi hoàn thành."
          icon={<Calculator className="h-8 w-8 text-muted-foreground" />}
          action={
            <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
              Tạo quyết toán
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-muted/30 p-4"
        >
          <h4 className="font-semibold text-sm mb-3">Tạo quyết toán hợp đồng</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="totalDisbursed">Tổng đã giải ngân (VND) *</Label>
                <Input
                  id="totalDisbursed"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.totalDisbursed}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalDisbursed: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalExpense">Tổng chi thực tế (VND) *</Label>
                <Input
                  id="totalExpense"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.totalExpense}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalExpense: e.target.value }))}
                />
              </div>
            </div>
            {form.totalDisbursed && form.totalExpense && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Kinh phí dư/thiếu: </span>
                <span className={parseFloat(form.totalDisbursed) - parseFloat(form.totalExpense) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {formatCurrency(parseFloat(form.totalDisbursed) - parseFloat(form.totalExpense))}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="settlementNotes">Ghi chú</Label>
              <Textarea
                id="settlementNotes"
                placeholder="Ghi chú thêm về tình hình quyết toán..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo quyết toán'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// Info grid item
// ────────────────────────────────────────────
function InfoItem({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

// ────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────
const FUNDING_METHOD_LABELS: Record<string, string> = {
  LUMP_SUM: 'Một lần',
  PARTIAL: 'Theo đợt',
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthStore()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const signMutation = useMutation({
    mutationFn: () => contractsApi.sign(id!),
    onSuccess: () => {
      toast.success('Ký hợp đồng thành công')
      void queryClient.invalidateQueries({ queryKey: ['contract', id] })
      void queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: () => {
      toast.error('Ký hợp đồng thất bại')
    },
  })

  const contract: Contract | null = data?.data?.data ?? null

  if (isLoading) return <DetailSkeleton />

  if (isError || !contract) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contracts')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <ErrorState
          title="Không tìm thấy hợp đồng"
          description="Hợp đồng không tồn tại hoặc bạn không có quyền truy cập."
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const canSign = isAdmin() && contract.status === 'DRAFT'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contracts')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{contract.contractNumber}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 ml-7">
              {getProposalTitle(contract.proposalId)}
            </p>
          </div>
        </div>
        {canSign && (
          <Button
            onClick={() => signMutation.mutate()}
            disabled={signMutation.isPending}
            className="gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            {signMutation.isPending ? 'Đang ký...' : 'Ký hợp đồng'}
          </Button>
        )}
      </div>

      {/* Info card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin hợp đồng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
              <InfoItem
                label="Số hợp đồng"
                value={
                  <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {contract.contractNumber}
                  </span>
                }
                icon={<FileSignature className="h-3 w-3" />}
              />
              <InfoItem
                label="Trạng thái"
                value={<StatusBadge status={contract.status} />}
              />
              <InfoItem
                label="Kinh phí"
                value={formatCurrency(contract.totalAmount)}
                icon={<DollarSign className="h-3 w-3" />}
              />
              <InfoItem
                label="Hình thức cấp kinh phí"
                value={FUNDING_METHOD_LABELS[contract.fundingMethod] ?? contract.fundingMethod}
              />
              <InfoItem
                label="Ngày bắt đầu"
                value={formatDate(contract.startDate)}
                icon={<Calendar className="h-3 w-3" />}
              />
              <InfoItem
                label="Ngày kết thúc"
                value={formatDate(contract.endDate)}
                icon={<Calendar className="h-3 w-3" />}
              />
              {contract.signedAt && (
                <InfoItem
                  label="Ngày ký"
                  value={formatDate(contract.signedAt)}
                  icon={<CheckCircle className="h-3 w-3" />}
                />
              )}
              <InfoItem
                label="Ngày tạo"
                value={formatDate(contract.createdAt)}
                icon={<Clock className="h-3 w-3" />}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25 }}>
        <Tabs defaultValue="disbursements">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="disbursements" className="gap-1.5">
              <Banknote className="h-3.5 w-3.5" />
              Giải ngân
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Sản phẩm
            </TabsTrigger>
            <TabsTrigger value="amendments" className="gap-1.5">
              <FilePen className="h-3.5 w-3.5" />
              Điều chỉnh
            </TabsTrigger>
            <TabsTrigger value="settlement" className="gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              Quyết toán
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disbursements">
            <DisbursementsTab contractId={contract._id} />
          </TabsContent>

          <TabsContent value="deliverables">
            <DeliverablesTab contractId={contract._id} />
          </TabsContent>

          <TabsContent value="amendments">
            <AmendmentsTab contractId={contract._id} />
          </TabsContent>

          <TabsContent value="settlement">
            <SettlementTab contractId={contract._id} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
