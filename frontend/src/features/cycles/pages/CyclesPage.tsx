import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, CalendarRange, Layers, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react'
import { cyclesApi } from '@/api/cycles.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'
import type { Cycle } from '@/types'

const cycleStatusMap: Record<Cycle['status'], { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' }> = {
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  OPEN: { label: 'Đang mở', variant: 'success' },
  CLOSED: { label: 'Đã đóng', variant: 'warning' },
  COMPLETED: { label: 'Hoàn thành', variant: 'default' },
}

const createCycleSchema = z.object({
  name: z.string().min(3, 'Tên chu kỳ ít nhất 3 ký tự'),
  code: z.string().min(2, 'Mã chu kỳ ít nhất 2 ký tự'),
  academicYear: z.string().min(4, 'Nhập năm học hợp lệ'),
  submissionStart: z.string().min(1, 'Chọn ngày bắt đầu nộp'),
  submissionEnd: z.string().min(1, 'Chọn ngày kết thúc nộp'),
  reviewStart: z.string().min(1, 'Chọn ngày bắt đầu phản biện'),
  reviewEnd: z.string().min(1, 'Chọn ngày kết thúc phản biện'),
  description: z.string().optional(),
})

type CreateCycleFormData = z.infer<typeof createCycleSchema>

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    </div>
  )
}

function CycleCard({ cycle, onOpen, onClose }: { cycle: Cycle; onOpen: (id: string) => void; onClose: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const status = cycleStatusMap[cycle.status]
  const isAdmin = useAuthStore((s) => s.isAdmin())

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold line-clamp-1">{cycle.name}</CardTitle>
              <CardDescription className="mt-0.5 font-mono text-xs">{cycle.code}</CardDescription>
            </div>
            <Badge variant={status.variant} className="flex-shrink-0">{status.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Date range */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="h-4 w-4 flex-shrink-0" />
            <span>
              {formatDate(cycle.submissionStart)} → {formatDate(cycle.submissionEnd)}
            </span>
          </div>

          {/* Academic year */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4 flex-shrink-0" />
            <span>Năm học: {cycle.academicYear}</span>
          </div>

          {/* Expand details */}
          <button
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>

          {expanded && (
            <motion.div
              className="space-y-1.5 text-xs text-muted-foreground border-t pt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <p><span className="font-medium text-foreground">Phản biện: </span>{formatDate(cycle.reviewStart)} → {formatDate(cycle.reviewEnd)}</p>
              {cycle.description && <p className="italic">{cycle.description}</p>}
              <p><span className="font-medium text-foreground">Tạo lúc: </span>{formatDate(cycle.createdAt)}</p>
            </motion.div>
          )}

          {/* Actions */}
          {isAdmin && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                disabled={cycle.status === 'OPEN' || cycle.status === 'COMPLETED'}
                onClick={() => onOpen(cycle._id)}
              >
                <Unlock className="h-3.5 w-3.5" />
                Mở chu kỳ
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                disabled={cycle.status !== 'OPEN'}
                onClick={() => onClose(cycle._id)}
              >
                <Lock className="h-3.5 w-3.5" />
                Đóng chu kỳ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function CyclesPage() {
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cycles'],
    queryFn: () => cyclesApi.list({ limit: 100 }),
    staleTime: 60_000,
  })

  const cycles = data?.data?.data?.items ?? []

  const createMutation = useMutation({
    mutationFn: (dto: CreateCycleFormData) => cyclesApi.create(dto),
    onSuccess: () => {
      toast.success('Tạo chu kỳ thành công')
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
      setDialogOpen(false)
      reset()
    },
    onError: () => toast.error('Không thể tạo chu kỳ', 'Vui lòng thử lại'),
  })

  const openMutation = useMutation({
    mutationFn: (id: string) => cyclesApi.open(id),
    onSuccess: () => {
      toast.success('Đã mở chu kỳ')
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
    },
    onError: () => toast.error('Không thể mở chu kỳ'),
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) => cyclesApi.close(id),
    onSuccess: () => {
      toast.success('Đã đóng chu kỳ')
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
    },
    onError: () => toast.error('Không thể đóng chu kỳ'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCycleFormData>({ resolver: zodResolver(createCycleSchema) })

  const onSubmit = (formData: CreateCycleFormData) => createMutation.mutate(formData)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chu kỳ Nghiên cứu"
        description="Quản lý các chu kỳ nghiên cứu khoa học của trường"
        actions={
          isAdmin ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Tạo chu kỳ
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : cycles.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="Chưa có chu kỳ nào"
                description="Tạo chu kỳ nghiên cứu đầu tiên để bắt đầu quản lý đề xuất."
                icon={<CalendarRange className="h-8 w-8 text-muted-foreground" />}
                action={
                  isAdmin ? (
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Tạo chu kỳ
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            cycles.map((cycle) => (
              <CycleCard
                key={cycle._id}
                cycle={cycle}
                onOpen={(id) => openMutation.mutate(id)}
                onClose={(id) => closeMutation.mutate(id)}
              />
            ))
          )}
        </div>
      )}

      {/* Create Cycle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => setDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Tạo chu kỳ nghiên cứu mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="name">Tên chu kỳ *</Label>
                <Input id="name" placeholder="Chu kỳ Nghiên cứu 2025" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code">Mã chu kỳ *</Label>
                <Input id="code" placeholder="NC2025" {...register('code')} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="academicYear">Năm học *</Label>
                <Input id="academicYear" placeholder="2025-2026" {...register('academicYear')} />
                {errors.academicYear && <p className="text-xs text-destructive">{errors.academicYear.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submissionStart">Bắt đầu nhận hồ sơ *</Label>
                <Input id="submissionStart" type="date" {...register('submissionStart')} />
                {errors.submissionStart && <p className="text-xs text-destructive">{errors.submissionStart.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submissionEnd">Kết thúc nhận hồ sơ *</Label>
                <Input id="submissionEnd" type="date" {...register('submissionEnd')} />
                {errors.submissionEnd && <p className="text-xs text-destructive">{errors.submissionEnd.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reviewStart">Bắt đầu phản biện *</Label>
                <Input id="reviewStart" type="date" {...register('reviewStart')} />
                {errors.reviewStart && <p className="text-xs text-destructive">{errors.reviewStart.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reviewEnd">Kết thúc phản biện *</Label>
                <Input id="reviewEnd" type="date" {...register('reviewEnd')} />
                {errors.reviewEnd && <p className="text-xs text-destructive">{errors.reviewEnd.message}</p>}
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" placeholder="Mô tả thêm về chu kỳ nghiên cứu..." rows={3} {...register('description')} />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); reset() }}>
                Hủy
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Tạo chu kỳ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
