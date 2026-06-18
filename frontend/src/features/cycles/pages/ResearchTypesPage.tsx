import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, FlaskConical, Pencil, Trash2, MoreVertical,
  Upload, FileSpreadsheet, X, BookOpen, Loader2, CheckCircle2,
} from 'lucide-react'
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

function useTopicCount(researchTypeId: string) {
  return useQuery({
    queryKey: ['research-type-topic-count', researchTypeId],
    queryFn: async () => {
      const res = await researchTypesApi.getTopics(researchTypeId)
      return (res.data?.data ?? []).length
    },
    staleTime: 30_000,
  })
}

interface ImportTopicsDialogProps {
  researchType: ResearchType
  open: boolean
  onClose: () => void
}

function ImportTopicsDialog({ researchType, open, onClose }: ImportTopicsDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const importMutation = useMutation({
    mutationFn: (file: File) => researchTypesApi.importTopics(researchType._id, file),
    onSuccess: (res) => {
      const count = res.data?.data?.count ?? 0
      toast.success(`Đã nhập ${count} đề tài thành công`)
      queryClient.invalidateQueries({ queryKey: ['research-type-topic-count', researchType._id] })
      queryClient.invalidateQueries({ queryKey: ['research-type-topics', researchType._id] })
      setSelectedFile(null)
      onClose()
    },
    onError: () => toast.error('Không thể nhập danh sách đề tài. Kiểm tra lại file Excel.'),
  })

  const handleFileChange = (file: File | null) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls') {
      toast.error('Chỉ chấp nhận file .xlsx hoặc .xls')
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0] ?? null
    handleFileChange(file)
  }

  const handleImport = () => {
    if (!selectedFile) return
    importMutation.mutate(selectedFile)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSelectedFile(null); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Nhập danh sách đề tài
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Loại nghiên cứu: <span className="font-medium text-foreground">{researchType.name}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Format guide */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Định dạng file Excel</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {[
                'TT', 'Đơn vị đặt hàng', 'Khu vực', 'Tên đề tài đặt hàng',
                'Mục tiêu', 'Yêu cầu', 'Sản phẩm dự kiến',
                'Phòng/Ban/Đơn vị/Cơ sở ứng dụng sản phẩm đề tài', 'Ghi chú',
              ].map((col) => (
                <p key={col} className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  {col}
                </p>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              * Cột "Tên đề tài đặt hàng" là bắt buộc. Import mới sẽ xóa danh sách cũ.
            </p>
          </div>

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-2"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline flex items-center gap-1 mx-auto"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                  >
                    <X className="h-3 w-3" /> Chọn lại
                  </button>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Kéo thả file hoặc nhấn để chọn</p>
                  <p className="text-xs text-muted-foreground">Hỗ trợ .xlsx, .xls — tối đa 10MB</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={importMutation.isPending}>Hủy</Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang nhập...</>
            ) : (
              <><Upload className="h-4 w-4" /> Nhập danh sách</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ResearchTypeCardProps {
  rt: ResearchType
  onEdit: (rt: ResearchType) => void
  onDelete: (id: string) => void
  onImportTopics: (rt: ResearchType) => void
  isDeleting: boolean
}

function ResearchTypeCard({ rt, onEdit, onDelete, onImportTopics, isDeleting }: ResearchTypeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: topicCount } = useTopicCount(rt._id)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
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
              {topicCount !== undefined && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {topicCount > 0 ? `${topicCount} đề tài` : 'Chưa có đề tài'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge variant={rt.isActive ? 'success' : 'secondary'} className="text-xs">
                {rt.isActive ? 'Đang dùng' : 'Tắt'}
              </Badge>
              {/* 3-dot menu */}
              <div className="relative">
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-7 z-20 min-w-[180px] rounded-lg border bg-popover shadow-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                          onClick={() => { setMenuOpen(false); onEdit(rt) }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          Sửa thông tin
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                          onClick={() => { setMenuOpen(false); onImportTopics(rt) }}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                          Thêm danh sách đề tài
                        </button>
                        <div className="border-t my-0.5" />
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => { setMenuOpen(false); onDelete(rt._id) }}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ResearchTypesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ResearchType | null>(null)
  const [importTarget, setImportTarget] = useState<ResearchType | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['research-types'],
    queryFn: () => researchTypesApi.list(),
  })

  const researchTypes: ResearchType[] = data?.data?.data ?? []

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
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
        description="Quản lý các loại hình nghiên cứu và danh sách đề tài đặt hàng"
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
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
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
            <ResearchTypeCard
              key={rt._id}
              rt={rt}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onImportTopics={(rt) => setImportTarget(rt)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
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

      {/* Import Topics dialog */}
      {importTarget && (
        <ImportTopicsDialog
          researchType={importTarget}
          open={!!importTarget}
          onClose={() => setImportTarget(null)}
        />
      )}
    </div>
  )
}
