import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileSignature, ChevronRight, Calendar, DollarSign } from 'lucide-react'
import { contractsApi } from '@/api/contracts.api'
import { proposalsApi } from '@/api/proposals.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CONTRACT_STATUS_LABELS } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'
import type { Contract, Proposal } from '@/types'

type StatusFilter = 'ALL' | 'DRAFT' | 'ACTIVE' | 'COMPLETED'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'ACTIVE', label: 'Đang hiệu lực' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
]

interface CreateContractForm {
  proposalId: string
  contractNumber: string
  startDate: string
  endDate: string
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-36" />
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-36" />
        </div>
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-md" />
      </td>
    </tr>
  )
}

function getProposalTitle(proposal: Contract['proposalId']): string {
  if (typeof proposal === 'string') return proposal
  return (proposal as Proposal).titleVI
}

export function ContractsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin, isStaff } = useAuthStore()
  const canCreate = isAdmin() || isStaff()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<CreateContractForm>({
    proposalId: '',
    contractNumber: '',
    startDate: '',
    endDate: '',
  })
  const [formErrors, setFormErrors] = useState<Partial<CreateContractForm>>({})

  const queryParams: Record<string, unknown> = { page, limit: 20 }
  if (statusFilter !== 'ALL') queryParams.status = statusFilter

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contracts', page, statusFilter],
    queryFn: () => contractsApi.list(queryParams),
    staleTime: 30_000,
  })

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals-for-contract'],
    queryFn: () => proposalsApi.list({ limit: 100, status: 'APPROVED' }),
    enabled: dialogOpen,
    staleTime: 60_000,
  })

  const createMutation = useMutation({
    mutationFn: (dto: Partial<Contract>) => contractsApi.create(dto),
    onSuccess: () => {
      toast.success('Tạo hợp đồng thành công')
      void queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setDialogOpen(false)
      resetForm()
    },
    onError: () => {
      toast.error('Tạo hợp đồng thất bại', 'Vui lòng kiểm tra lại thông tin và thử lại.')
    },
  })

  const contracts = data?.data?.data?.items ?? []
  const total = data?.data?.data?.total ?? 0
  const totalPages = data?.data?.data?.totalPages ?? 1
  const start = total === 0 ? 0 : (page - 1) * 20 + 1
  const end = Math.min(page * 20, total)

  const proposals = proposalsData?.data?.data?.items ?? []

  function resetForm() {
    setForm({ proposalId: '', contractNumber: '', startDate: '', endDate: '' })
    setFormErrors({})
  }

  function validateForm(): boolean {
    const errors: Partial<CreateContractForm> = {}
    if (!form.proposalId) errors.proposalId = 'Vui lòng chọn đề tài'
    if (!form.contractNumber.trim()) errors.contractNumber = 'Số hợp đồng không được để trống'
    if (!form.startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu'
    if (!form.endDate) errors.endDate = 'Vui lòng chọn ngày kết thúc'
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return
    createMutation.mutate({
      proposalId: form.proposalId,
      contractNumber: form.contractNumber.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    })
  }

  function handleTabChange(value: string) {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hợp đồng Nghiên cứu"
        description="Quản lý hợp đồng nghiên cứu và theo dõi tiến độ thực hiện"
        actions={
          canCreate ? (
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Tạo hợp đồng
            </Button>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-3">
        <Tabs value={statusFilter} onValueChange={handleTabChange}>
          <TabsList className="h-9">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Số hợp đồng</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Đề tài</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kinh phí</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ngày bắt đầu</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ngày kết thúc</th>
                <th className="px-4 py-3 w-10" />
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
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-2">
                    <EmptyState
                      title="Không có hợp đồng nào"
                      description="Chưa có hợp đồng nào khớp với bộ lọc hiện tại."
                      icon={<FileSignature className="h-8 w-8 text-muted-foreground" />}
                      action={
                        canCreate ? (
                          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Tạo hợp đồng
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                contracts.map((contract, i) => (
                  <motion.tr
                    key={contract._id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => navigate(`/contracts/${contract._id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {contract.contractNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground line-clamp-1 max-w-xs">
                        {getProposalTitle(contract.proposalId)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={contract.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-foreground flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatCurrency(contract.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(contract.startDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(contract.endDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !isError && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {start}–{end} / {total} hợp đồng
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

      {/* Create contract dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo hợp đồng mới</DialogTitle>
          </DialogHeader>
          <DialogClose onClose={() => { setDialogOpen(false); resetForm() }} />

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Proposal select */}
            <div className="space-y-1.5">
              <Label htmlFor="proposalId">Đề tài nghiên cứu *</Label>
              <Select
                id="proposalId"
                value={form.proposalId}
                onChange={(e) => setForm((prev) => ({ ...prev, proposalId: e.target.value }))}
              >
                <option value="">-- Chọn đề tài --</option>
                {proposals.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.titleVI}
                  </option>
                ))}
              </Select>
              {formErrors.proposalId && (
                <p className="text-xs text-destructive">{formErrors.proposalId}</p>
              )}
            </div>

            {/* Contract number */}
            <div className="space-y-1.5">
              <Label htmlFor="contractNumber">Số hợp đồng *</Label>
              <Input
                id="contractNumber"
                placeholder="VD: HD-KHCN-2025-001"
                value={form.contractNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, contractNumber: e.target.value }))}
              />
              {formErrors.contractNumber && (
                <p className="text-xs text-destructive">{formErrors.contractNumber}</p>
              )}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
                {formErrors.startDate && (
                  <p className="text-xs text-destructive">{formErrors.startDate}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Ngày kết thúc *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
                {formErrors.endDate && (
                  <p className="text-xs text-destructive">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); resetForm() }}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo hợp đồng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
