import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Settings, Layers, Plus,
  Save, AlertCircle,
} from 'lucide-react'
import { cyclesApi } from '@/api/cycles.api'
import { researchTypesApi } from '@/api/researchTypes.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import type { Track } from '@/types'

const configSchema = z
  .object({
    academicYear: z.string().optional(),
    researchTypeId: z.string().optional(),
    submissionStart: z.string().optional(),
    submissionEnd: z.string().optional(),
    reviewStart: z.string().optional(),
    reviewEnd: z.string().optional(),
    progressReportDeadline: z.string().optional(),
    finalReportDeadline: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const toDate = (s?: string) => (s ? new Date(s) : null)
    const ss = toDate(d.submissionStart)
    const se = toDate(d.submissionEnd)
    const rs = toDate(d.reviewStart)
    const re = toDate(d.reviewEnd)
    const pr = toDate(d.progressReportDeadline)
    const fr = toDate(d.finalReportDeadline)

    if (ss && se && se <= ss) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['submissionEnd'], message: 'Kết thúc nhận hồ sơ phải sau Bắt đầu nhận hồ sơ' })
    }
    if (se && rs && rs <= se) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewStart'], message: 'Bắt đầu xét duyệt phải sau Kết thúc nhận hồ sơ' })
    }
    if (rs && re && re <= rs) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewEnd'], message: 'Kết thúc xét duyệt phải sau Bắt đầu xét duyệt' })
    }
    if (re && pr && pr <= re) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['progressReportDeadline'], message: 'Hạn báo cáo tiến độ phải sau Kết thúc xét duyệt' })
    }
    if (pr && fr && fr <= pr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['finalReportDeadline'], message: 'Hạn báo cáo nghiệm thu phải sau Hạn báo cáo tiến độ' })
    }
  })

type ConfigFormData = z.infer<typeof configSchema>

const trackSchema = z.object({
  name: z.string().min(2, 'Ít nhất 2 ký tự'),
  code: z.string().optional(),
  description: z.string().optional(),
})

type TrackFormData = z.infer<typeof trackSchema>

function toInputDate(dateStr?: string) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export function CycleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addTrackOpen, setAddTrackOpen] = useState(false)

  const { data: cycleData, isLoading: cycleLoading } = useQuery({
    queryKey: ['cycle', id],
    queryFn: () => cyclesApi.getById(id!),
    enabled: !!id,
  })

  const { data: rtData } = useQuery({
    queryKey: ['research-types'],
    queryFn: () => researchTypesApi.list(),
  })

  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['cycle-tracks', id],
    queryFn: () => cyclesApi.getTracks(id!),
    enabled: !!id,
  })

  const cycle = cycleData?.data?.data
  const researchTypes = rtData?.data?.data ?? []
  const tracks = tracksData?.data?.data ?? []

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    values: cycle ? {
      academicYear: cycle.academicYear ?? '',
      researchTypeId: typeof cycle.researchTypeId === 'object' ? cycle.researchTypeId._id : cycle.researchTypeId ?? '',
      submissionStart: toInputDate(cycle.submissionStart),
      submissionEnd: toInputDate(cycle.submissionEnd),
      reviewStart: toInputDate(cycle.reviewStart),
      reviewEnd: toInputDate(cycle.reviewEnd),
      progressReportDeadline: toInputDate(cycle.progressReportDeadline),
      finalReportDeadline: toInputDate(cycle.finalReportDeadline),
      description: cycle.description ?? '',
    } : undefined,
  })

  const configMutation = useMutation({
    mutationFn: (dto: ConfigFormData) => cyclesApi.configure(id!, dto),
    onSuccess: () => {
      toast.success('Cấu hình chu kỳ thành công')
      queryClient.invalidateQueries({ queryKey: ['cycle', id] })
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
    },
    onError: () => toast.error('Lỗi cấu hình', 'Vui lòng thử lại'),
  })

  const {
    register: registerTrack,
    handleSubmit: handleTrackSubmit,
    reset: resetTrack,
    formState: { errors: trackErrors },
  } = useForm<TrackFormData>({ resolver: zodResolver(trackSchema) })

  const addTrackMutation = useMutation({
    mutationFn: (dto: TrackFormData) => cyclesApi.createTrack(id!, dto),
    onSuccess: () => {
      toast.success('Thêm lĩnh vực thành công')
      queryClient.invalidateQueries({ queryKey: ['cycle-tracks', id] })
      setAddTrackOpen(false)
      resetTrack()
    },
    onError: () => toast.error('Không thể thêm lĩnh vực'),
  })

  if (cycleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Không tìm thấy chu kỳ</p>
        <Button variant="outline" onClick={() => navigate('/cycles')}>Quay lại</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cycles')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Danh sách chu kỳ
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{cycle.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-0.5">{cycle.code}</p>
        </div>
        <Badge variant={cycle.status === 'OPEN' ? 'success' : 'secondary'}>
          {cycle.status === 'PLANNING' ? 'Lên kế hoạch' : cycle.status === 'OPEN' ? 'Đang mở' : cycle.status}
        </Badge>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Cấu hình
          </TabsTrigger>
          <TabsTrigger value="tracks" className="gap-2">
            <Layers className="h-4 w-4" />
            Lĩnh vực nghiên cứu
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Cấu hình ─────────────────────────────────────────── */}
        <TabsContent value="config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cấu hình chu kỳ nghiên cứu</CardTitle>
              <CardDescription>Staff cấu hình thông tin chi tiết của chu kỳ</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => configMutation.mutate(d))} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Năm học</Label>
                    <Input placeholder="2025-2026" {...register('academicYear')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Loại nghiên cứu</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={watch('researchTypeId') ?? ''}
                      onChange={(e) => setValue('researchTypeId', e.target.value || undefined)}
                    >
                      <option value="">-- Chọn loại nghiên cứu --</option>
                      {researchTypes.map((rt) => (
                        <option key={rt._id} value={rt._id}>
                          {rt.name}
                        </option>
                      ))}
                    </select>
                    {errors.researchTypeId && (
                      <p className="text-xs text-destructive">{errors.researchTypeId.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Bắt đầu nhận hồ sơ</Label>
                    <Input type="date" {...register('submissionStart')} />
                    {errors.submissionStart && <p className="text-xs text-destructive">{errors.submissionStart.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kết thúc nhận hồ sơ</Label>
                    <Input type="date" {...register('submissionEnd')} />
                    {errors.submissionEnd && <p className="text-xs text-destructive">{errors.submissionEnd.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Bắt đầu xét duyệt</Label>
                    <Input type="date" {...register('reviewStart')} />
                    {errors.reviewStart && <p className="text-xs text-destructive">{errors.reviewStart.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kết thúc xét duyệt</Label>
                    <Input type="date" {...register('reviewEnd')} />
                    {errors.reviewEnd && <p className="text-xs text-destructive">{errors.reviewEnd.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Hạn nộp báo cáo tiến độ</Label>
                    <Input type="date" {...register('progressReportDeadline')} />
                    {errors.progressReportDeadline && <p className="text-xs text-destructive">{errors.progressReportDeadline.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hạn nộp báo cáo nghiệm thu</Label>
                    <Input type="date" {...register('finalReportDeadline')} />
                    {errors.finalReportDeadline && <p className="text-xs text-destructive">{errors.finalReportDeadline.message}</p>}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Mô tả</Label>
                    <Textarea placeholder="Mô tả thêm về chu kỳ nghiên cứu..." rows={3} {...register('description')} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" loading={configMutation.isPending} className="gap-2">
                    <Save className="h-4 w-4" />
                    Lưu cấu hình
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Lĩnh vực ─────────────────────────────────────────── */}
        <TabsContent value="tracks" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Lĩnh vực nghiên cứu</h3>
              <p className="text-sm text-muted-foreground">Các lĩnh vực nghiên cứu trong chu kỳ này</p>
            </div>
            <Button size="sm" onClick={() => setAddTrackOpen(true)}>
              <Plus className="h-4 w-4" />
              Thêm lĩnh vực
            </Button>
          </div>

          {tracksLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Chưa có lĩnh vực nào. Thêm lĩnh vực để Faculty chọn khi nộp đề xuất.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tracks.map((track: Track) => (
                <motion.div
                  key={track._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{track.name}</p>
                        {track.code && <p className="text-xs text-muted-foreground font-mono">{track.code}</p>}
                        {track.description && <p className="text-xs text-muted-foreground mt-1">{track.description}</p>}
                      </div>
                      <Badge variant={track.isActive ? 'success' : 'secondary'} className="text-xs">
                        {track.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add Track Dialog */}
          <Dialog open={addTrackOpen} onOpenChange={setAddTrackOpen}>
            <DialogContent className="max-w-md">
              <DialogClose onClose={() => setAddTrackOpen(false)} />
              <DialogHeader>
                <DialogTitle>Thêm lĩnh vực nghiên cứu</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTrackSubmit((d) => addTrackMutation.mutate(d))} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Tên lĩnh vực *</Label>
                  <Input placeholder="Công nghệ thông tin" {...registerTrack('name')} />
                  {trackErrors.name && <p className="text-xs text-destructive">{trackErrors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Mã lĩnh vực</Label>
                  <Input placeholder="CNTT" {...registerTrack('code')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Mô tả</Label>
                  <Textarea rows={2} {...registerTrack('description')} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddTrackOpen(false)}>Hủy</Button>
                  <Button type="submit" loading={addTrackMutation.isPending}>Thêm</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

      </Tabs>
    </div>
  )
}
