import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  CheckCircle2,
  XCircle,
  Upload,
  Clock,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ApiResponse, Contract, Deliverable } from '@/types'

const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ nộp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
}

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

const DELIVERABLE_STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Clock,
  SUBMITTED: Upload,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
}

function DeliverableStatusBadge({ status }: { status: string }) {
  const Icon = DELIVERABLE_STATUS_ICON[status] ?? Clock
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        DELIVERABLE_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      <Icon className="h-3 w-3" />
      {DELIVERABLE_STATUS_LABELS[status] ?? status}
    </span>
  )
}

function SubmitDeliverableDialog({
  open,
  onOpenChange,
  deliverable,
  contractId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  deliverable: Deliverable | null
  contractId: string
}) {
  const queryClient = useQueryClient()
  const [fileUrl, setFileUrl] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch<ApiResponse<Deliverable>>(
        `/contracts/${contractId}/deliverables/${deliverable?._id}/submit`,
        { fileUrl },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', contractId] })
      onOpenChange(false)
      setFileUrl('')
      setError('')
    },
    onError: () => setError('Không thể nộp sản phẩm. Vui lòng thử lại.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nộp Sản phẩm</DialogTitle>
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />
        {deliverable && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/40 p-3.5 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Sản phẩm #{deliverable.sequence}
              </p>
              <p className="text-sm font-medium">{deliverable.title}</p>
              {deliverable.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Hạn nộp: {formatDate(deliverable.dueDate)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlFileUrl">Đường dẫn file sản phẩm</Label>
              <Input
                id="dlFileUrl"
                type="url"
                placeholder="https://drive.google.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tải file lên Google Drive hoặc dịch vụ lưu trữ và dán đường dẫn vào đây.
              </p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!fileUrl || mutation.isPending}>
            {mutation.isPending ? 'Đang nộp...' : 'Nộp sản phẩm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContractDeliverables({
  contract,
  isFacultyUser,
  isAdminUser,
}: {
  contract: Contract
  isFacultyUser: boolean
  isAdminUser: boolean
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(true)
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [showSubmit, setShowSubmit] = useState(false)

  const { data: deliverablesData, isLoading } = useQuery({
    queryKey: ['deliverables', contract._id],
    queryFn: () => contractsApi.getDeliverables(contract._id).then((r) => r.data.data),
    staleTime: 60_000,
  })

  const approveMutation = useMutation({
    mutationFn: (deliverableId: string) =>
      apiClient.patch<ApiResponse<Deliverable>>(
        `/contracts/${contract._id}/deliverables/${deliverableId}/approve`,
        {},
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliverables', contract._id] }),
  })

  const rejectMutation = useMutation({
    mutationFn: (deliverableId: string) =>
      apiClient.patch<ApiResponse<Deliverable>>(
        `/contracts/${contract._id}/deliverables/${deliverableId}/reject`,
        {},
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliverables', contract._id] }),
  })

  const deliverables = (deliverablesData ?? []) as Deliverable[]
  const completedCount = deliverables.filter((d) => d.status === 'APPROVED').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden"
    >
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Contract header */}
        <CardHeader
          className="py-4 px-5 border-b bg-muted/20 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">{contract.contractNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{deliverables.length} sản phẩm hoàn thành
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress bar */}
              {deliverables.length > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round((completedCount / deliverables.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((completedCount / deliverables.length) * 100)}%
                  </span>
                </div>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-0">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-7 w-16 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : deliverables.length === 0 ? (
                  <div className="py-10 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {deliverables
                      .sort((a, b) => a.sequence - b.sequence)
                      .map((deliverable, i) => (
                        <motion.div
                          key={deliverable._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                        >
                          {/* Sequence badge */}
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                            {deliverable.sequence}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{deliverable.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {deliverable.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  Hạn: {formatDate(deliverable.dueDate)}
                                </span>
                              )}
                              {deliverable.submittedAt && (
                                <span className="text-xs text-muted-foreground">
                                  · Nộp: {formatDate(deliverable.submittedAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* File link */}
                          {deliverable.fileUrl && (
                            <a
                              href={deliverable.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              File
                            </a>
                          )}

                          {/* Status */}
                          <DeliverableStatusBadge status={deliverable.status} />

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isFacultyUser && deliverable.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  setSelectedDeliverable(deliverable)
                                  setShowSubmit(true)
                                }}
                              >
                                <Upload className="h-3 w-3" />
                                Nộp
                              </Button>
                            )}
                            {isAdminUser && deliverable.status === 'SUBMITTED' && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => approveMutation.mutate(deliverable._id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => rejectMutation.mutate(deliverable._id)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <SubmitDeliverableDialog
        open={showSubmit}
        onOpenChange={setShowSubmit}
        deliverable={selectedDeliverable}
        contractId={contract._id}
      />
    </motion.div>
  )
}

export function DeliverablesPage() {
  const { isAdmin, isStaff, isFaculty } = useAuthStore()
  const isAdminUser = isAdmin() || isStaff()
  const isFacultyUser = isFaculty()

  const contractsQuery = useQuery({
    queryKey: ['contracts', 'deliverables-page'],
    queryFn: () => contractsApi.list().then((r) => r.data.data),
    staleTime: 120_000,
  })

  const contracts = contractsQuery.data?.items ?? []
  const isLoading = contractsQuery.isLoading

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Sản phẩm Đề tài"
          description={
            isAdminUser
              ? 'Xem xét và phê duyệt sản phẩm nghiên cứu theo từng hợp đồng'
              : 'Theo dõi và nộp sản phẩm nghiên cứu theo tiến độ hợp đồng'
          }
        />
      </motion.div>

      {/* Stats when loaded */}
      {!isLoading && contracts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700">
            <Briefcase className="h-3 w-3" />
            {contracts.length} hợp đồng
          </div>
        </motion.div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-5 border-b bg-muted/20">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          title="Chưa có hợp đồng"
          description="Các sản phẩm đề tài sẽ hiển thị theo từng hợp đồng nghiên cứu đang hoạt động."
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <ContractDeliverables
              key={contract._id}
              contract={contract}
              isFacultyUser={isFacultyUser}
              isAdminUser={isAdminUser}
            />
          ))}
        </div>
      )}
    </div>
  )
}
