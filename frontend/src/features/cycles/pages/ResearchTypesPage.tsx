import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, FlaskConical, Pencil, Trash2 } from 'lucide-react'
import { researchTypesApi } from '@/api/researchTypes.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import type { ResearchType } from '@/types'

const formSchema = z.object({
  name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
  code: z.string().min(1, 'Mã bắt buộc').max(50),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const CODE_SUGGESTIONS = [
  { code: 'APPLIED', label: 'Nghiên cứu ứng dụng' },
  { code: 'PAPER', label: 'Bài báo khoa học' },
  { code: 'BASIC', label: 'Nghiên cứu cơ bản' },
]

export function ResearchTypesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ResearchType | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['research-types'],
    queryFn: () => researchTypesApi.list(),
  })

  const researchTypes: ResearchType[] = data?.data?.data ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', code: '', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (rt: ResearchType) => {
    setEditing(rt)
    reset({ name: rt.name, code: rt.code, description: rt.description ?? '' })
    setDialogOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: (dto: FormData) => researchTypesApi.create(dto),
    onSuccess: () => {
      toast.success('Tạo loại nghiên cứu thành công')
      queryClient.invalidateQueries({ queryKey: ['research-types'] })
      setDialogOpen(false)
    },
    onError: () => toast.error('Không thể tạo loại nghiên cứu'),
  })

  const updateMutation = useMutation({
    mutationFn: (dto: FormData) => researchTypesApi.update(editing!._id, dto),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      queryClient.invalidateQueries({ queryKey: ['research-types'] })
      setDialogOpen(false)
    },
    onError: () => toast.error('Không thể cập nhật'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => researchTypesApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa')
      queryClient.invalidateQueries({ queryKey: ['research-types'] })
    },
    onError: () => toast.error('Không thể xóa'),
  })

  const onSubmit = (dto: FormData) => {
    if (editing) updateMutation.mutate(dto)
    else createMutation.mutate(dto)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loại nghiên cứu"
        description="Quản lý các loại hình nghiên cứu (ứng dụng, bài báo...)"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm loại nghiên cứu
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : researchTypes.length === 0 ? (
        <EmptyState
          title="Chưa có loại nghiên cứu"
          description="Tạo các loại nghiên cứu để Staff cấu hình khi tạo chu kỳ."
          icon={<FlaskConical className="h-8 w-8 text-muted-foreground" />}
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Thêm loại nghiên cứu</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {researchTypes.map((rt) => (
            <motion.div key={rt._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{rt.name}</p>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                        {rt.code}
                      </code>
                      {rt.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rt.description}</p>
                      )}
                    </div>
                    <Badge variant={rt.isActive ? 'success' : 'secondary'} className="text-xs flex-shrink-0">
                      {rt.isActive ? 'Đang dùng' : 'Tắt'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(rt)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(rt._id)}
                      loading={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogClose onClose={() => setDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa loại nghiên cứu' : 'Thêm loại nghiên cứu'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên loại nghiên cứu *</Label>
              <Input placeholder="Nghiên cứu ứng dụng" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Mã *</Label>
              <Input placeholder="APPLIED" {...register('code')} className="font-mono" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {CODE_SUGGESTIONS.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted transition-colors font-mono"
                    onClick={() => { setValue('code', s.code); setValue('name', s.label) }}
                  >
                    {s.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea rows={2} placeholder="Mô tả loại nghiên cứu..." {...register('description')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" loading={isPending}>
                {editing ? 'Lưu thay đổi' : 'Tạo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
