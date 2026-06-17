import { useState, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, AlignLeft, Tag, DollarSign, X } from 'lucide-react'
import { proposalsApi } from '@/api/proposals.api'
import { cyclesApi } from '@/api/cycles.api'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import type { Cycle, Track } from '@/types'

const createProposalSchema = z.object({
  titleVI: z.string().min(10, 'Tên đề tài tiếng Việt ít nhất 10 ký tự'),
  titleEN: z.string().min(5, 'Tên đề tài tiếng Anh ít nhất 5 ký tự'),
  cycleId: z.string().min(1, 'Vui lòng chọn chu kỳ'),
  trackId: z.string().optional(),
  abstract: z.string().min(100, 'Tóm tắt ít nhất 100 ký tự'),
  fundingMethod: z.enum(['LUMP_SUM', 'PARTIAL']),
  totalAmount: z.coerce.number().min(1_000_000, 'Kinh phí ít nhất 1.000.000 VND'),
  duration: z.coerce.number().min(1, 'Thời gian ít nhất 1 tháng').max(60, 'Thời gian tối đa 60 tháng'),
})

type CreateProposalFormInput = z.input<typeof createProposalSchema>
type CreateProposalFormData = z.output<typeof createProposalSchema>

interface SectionCardProps {
  number: number
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function SectionCard({ number, icon, title, children }: SectionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-3">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
            {number}
          </span>
          <span className="text-primary flex-shrink-0">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function CreateProposalPage() {
  const navigate = useNavigate()
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateProposalFormInput, unknown, CreateProposalFormData>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: { fundingMethod: 'LUMP_SUM' },
  })

  const selectedCycleId = watch('cycleId')

  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: () => cyclesApi.list({ limit: 100, status: 'OPEN' }),
    staleTime: 60_000,
  })
  const cycles: Cycle[] = cyclesData?.data?.data?.items ?? []

  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['cycles', selectedCycleId, 'tracks'],
    queryFn: () => cyclesApi.getTracks(selectedCycleId),
    enabled: !!selectedCycleId,
    staleTime: 60_000,
  })
  const tracks: Track[] = tracksData?.data?.data ?? []

  const createMutation = useMutation({
    mutationFn: (dto: CreateProposalFormData) =>
      proposalsApi.create({
        ...dto,
        keywords,
        trackId: dto.trackId || undefined,
      }),
    onSuccess: () => {
      toast.success('Tạo đề xuất thành công', 'Đề xuất đã được lưu ở trạng thái nháp')
      navigate('/proposals/my')
    },
    onError: () => toast.error('Không thể tạo đề xuất', 'Vui lòng thử lại'),
  })

  const onSubmit = (formData: CreateProposalFormData) => createMutation.mutate(formData)

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = keywordInput.trim()
      if (trimmed && !keywords.includes(trimmed)) {
        setKeywords((prev) => [...prev, trimmed])
      }
      setKeywordInput('')
    }
  }

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw))
  }

  // Reset tracks when cycle changes
  useEffect(() => {}, [selectedCycleId])

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/proposals/my')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Tạo Đề xuất Nghiên cứu"
          description="Điền đầy đủ thông tin để tạo đề xuất nghiên cứu mới"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Section 1: Thông tin cơ bản */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.22 }}
        >
          <SectionCard number={1} icon={<BookOpen className="h-4 w-4" />} title="Thông tin cơ bản">
            <div className="space-y-1.5">
              <Label htmlFor="titleVI">Tên đề tài (Tiếng Việt) *</Label>
              <Input
                id="titleVI"
                placeholder="Nghiên cứu và phát triển hệ thống..."
                {...register('titleVI')}
              />
              {errors.titleVI && <p className="text-xs text-destructive">{errors.titleVI.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="titleEN">Tên đề tài (Tiếng Anh) *</Label>
              <Input
                id="titleEN"
                placeholder="Research and Development of..."
                {...register('titleEN')}
              />
              {errors.titleEN && <p className="text-xs text-destructive">{errors.titleEN.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cycleId">Chu kỳ nghiên cứu *</Label>
                {cyclesLoading ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : (
                  <Select id="cycleId" {...register('cycleId')}>
                    <option value="">-- Chọn chu kỳ --</option>
                    {cycles.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.academicYear})</option>
                    ))}
                  </Select>
                )}
                {errors.cycleId && <p className="text-xs text-destructive">{errors.cycleId.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="trackId">Lĩnh vực (Track)</Label>
                {tracksLoading && selectedCycleId ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : (
                  <Select
                    id="trackId"
                    {...register('trackId')}
                    disabled={!selectedCycleId || tracks.length === 0}
                  >
                    <option value="">-- Chọn lĩnh vực --</option>
                    {tracks.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </Select>
                )}
                {!selectedCycleId && (
                  <p className="text-xs text-muted-foreground">Chọn chu kỳ trước</p>
                )}
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Section 2: Tóm tắt */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.22 }}
        >
          <SectionCard number={2} icon={<AlignLeft className="h-4 w-4" />} title="Tóm tắt">
            <div className="space-y-1.5">
              <Label htmlFor="abstract">Tóm tắt đề xuất * <span className="text-muted-foreground font-normal">(tối thiểu 100 ký tự)</span></Label>
              <Textarea
                id="abstract"
                rows={6}
                placeholder="Mô tả mục tiêu, phương pháp nghiên cứu, kết quả dự kiến và tính ứng dụng của đề tài nghiên cứu..."
                {...register('abstract')}
              />
              {errors.abstract && <p className="text-xs text-destructive">{errors.abstract.message}</p>}
            </div>
          </SectionCard>
        </motion.div>

        {/* Section 3: Từ khóa */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13, duration: 0.22 }}
        >
          <SectionCard number={3} icon={<Tag className="h-4 w-4" />} title="Từ khóa">
            <div className="space-y-2">
              <Label htmlFor="keyword-input">Từ khóa</Label>
              <Input
                id="keyword-input"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Nhập từ khóa và nhấn Enter để thêm..."
              />
              <p className="text-xs text-muted-foreground">Nhập từ khóa rồi nhấn Enter để thêm vào danh sách</p>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-default"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>

        {/* Section 4: Ngân sách */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.22 }}
        >
          <SectionCard number={4} icon={<DollarSign className="h-4 w-4" />} title="Ngân sách">
            <div className="space-y-2">
              <Label>Phương thức cấp kinh phí *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input type="radio" value="LUMP_SUM" {...register('fundingMethod')} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Một lần (Lump Sum)</p>
                    <p className="text-xs text-muted-foreground">Giải ngân toàn bộ kinh phí một lần</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input type="radio" value="PARTIAL" {...register('fundingMethod')} className="mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Nhiều đợt (Partial)</p>
                    <p className="text-xs text-muted-foreground">Giải ngân theo từng đợt nghiệm thu</p>
                  </div>
                </label>
              </div>
              {errors.fundingMethod && <p className="text-xs text-destructive">{errors.fundingMethod.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="totalAmount">Tổng kinh phí (VND) *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="50000000"
                  min={0}
                  {...register('totalAmount')}
                />
                {errors.totalAmount && <p className="text-xs text-destructive">{errors.totalAmount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration">Thời gian thực hiện (tháng) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="12"
                  min={1}
                  max={60}
                  {...register('duration')}
                />
                {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Submit Actions */}
        <motion.div
          className="flex gap-3 justify-end pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <Button type="button" variant="outline" onClick={() => navigate('/proposals/my')}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="outline"
            loading={createMutation.isPending}
            onClick={() => {}}
          >
            Lưu nháp
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Lưu và Nộp
          </Button>
        </motion.div>
      </form>
    </div>
  )
}
