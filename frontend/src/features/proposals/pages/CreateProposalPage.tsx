import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, AlignLeft, Tag, DollarSign, X, Upload,
  Sparkles, Loader2, FileText, CheckCircle2, AlertCircle, Save, Send,
  ChevronRight,
} from 'lucide-react'
import { proposalsApi } from '@/api/proposals.api'
import { cyclesApi } from '@/api/cycles.api'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import apiClient from '@/api/client'
import type { ApiResponse, Cycle, Track, AppliedTopic } from '@/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const proposalSchema = z.object({
  titleVI: z.string().min(10, 'Tên tiếng Việt ít nhất 10 ký tự'),
  titleEN: z.string().min(5, 'Tên tiếng Anh ít nhất 5 ký tự'),
  cycleId: z.string().min(1, 'Vui lòng chọn chu kỳ'),
  trackId: z.string().optional(),
  appliedTopicId: z.string().optional(),
  objectives: z.string().min(30, 'Mục tiêu ít nhất 30 ký tự'),
  methodology: z.string().min(30, 'Phương pháp ít nhất 30 ký tự'),
  expectedOutput: z.string().optional(),
  fundingMethod: z.enum(['LUMP_SUM', 'PARTIAL']),
  totalAmount: z.coerce.number().min(1_000_000, 'Kinh phí ít nhất 1.000.000 VND'),
  durationMonths: z.coerce.number().min(1).max(60),
})

type ProposalFormData = z.infer<typeof proposalSchema>

// ─── AI parse response ────────────────────────────────────────────────────────

interface ParsedProposalData {
  titleVI?: string
  titleEN?: string
  objectives?: string
  methodology?: string
  expectedOutput?: string
  durationMonths?: number
  totalAmount?: number
}

async function parseProposalFile(file: File): Promise<ParsedProposalData> {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<ParsedProposalData>>(
    '/ai/parse-proposal-file',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return res.data.data ?? {}
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepBadge({ step, current }: { step: number; current: number }) {
  const done = current > step
  const active = current === step
  return (
    <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border-2 transition-colors ${
      done ? 'bg-primary border-primary text-primary-foreground' :
      active ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
    }`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ number, icon, title, children }: {
  number: number; icon: React.ReactNode; title: string; children: React.ReactNode
}) {
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

// ─── Main component ───────────────────────────────────────────────────────────

type FormStep = 1 | 2

export function CreateProposalPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<FormStep>(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { fundingMethod: 'LUMP_SUM' },
  })

  const selectedCycleId = watch('cycleId')

  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['cycles-open'],
    queryFn: () => cyclesApi.list({ limit: 100, status: 'OPEN' }),
    staleTime: 60_000,
  })
  const cycles: Cycle[] = cyclesData?.data?.data?.items ?? []

  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['cycle-tracks', selectedCycleId],
    queryFn: () => cyclesApi.getTracks(selectedCycleId),
    enabled: !!selectedCycleId,
    staleTime: 60_000,
  })
  const tracks: Track[] = tracksData?.data?.data ?? []

  const selectedCycle = cycles.find((c) => c._id === selectedCycleId)
  const isApplied = selectedCycle && typeof selectedCycle.researchTypeId === 'object'
    ? selectedCycle.researchTypeId.code === 'APPLIED'
    : false

  const { data: topicsData } = useQuery({
    queryKey: ['applied-topics', selectedCycleId],
    queryFn: () => cyclesApi.getAppliedTopics(selectedCycleId),
    enabled: !!selectedCycleId && isApplied,
    staleTime: 60_000,
  })
  const appliedTopics: AppliedTopic[] = topicsData?.data?.data ?? []

  const saveDraftMutation = useMutation({
    mutationFn: (dto: ProposalFormData) => proposalsApi.create({ ...dto, keywords, status: 'DRAFT' }),
    onSuccess: () => {
      toast.success('Đã lưu nháp', 'Bạn có thể tiếp tục chỉnh sửa sau')
      navigate('/proposals/my')
    },
    onError: () => toast.error('Không thể lưu nháp'),
  })

  const submitMutation = useMutation({
    mutationFn: async (dto: ProposalFormData) => {
      const proposal = await proposalsApi.create({ ...dto, keywords, status: 'DRAFT' })
      const id = proposal.data.data?._id
      if (id) await proposalsApi.submit(id)
      return proposal
    },
    onSuccess: () => {
      toast.success('Nộp đề xuất thành công')
      navigate('/proposals/my')
    },
    onError: () => toast.error('Không thể nộp đề xuất'),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setParseError(null)
    setIsParsing(true)
    try {
      const parsed = await parseProposalFile(file)
      if (parsed.titleVI) setValue('titleVI', parsed.titleVI)
      if (parsed.titleEN) setValue('titleEN', parsed.titleEN)
      if (parsed.objectives) setValue('objectives', parsed.objectives)
      if (parsed.methodology) setValue('methodology', parsed.methodology)
      if (parsed.expectedOutput) setValue('expectedOutput', parsed.expectedOutput)
      if (parsed.durationMonths) setValue('durationMonths', parsed.durationMonths)
      if (parsed.totalAmount) setValue('totalAmount', parsed.totalAmount)
      toast.success('AI đã đọc và điền nội dung', 'Kiểm tra và chỉnh sửa nếu cần')
      setStep(2)
    } catch {
      setParseError('Không thể phân tích file. Vui lòng kiểm tra định dạng hoặc điền thủ công.')
      setStep(2)
    } finally {
      setIsParsing(false)
    }
    e.target.value = ''
  }

  const skipUpload = () => {
    setUploadedFile(null)
    setStep(2)
  }

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = keywordInput.trim()
      if (trimmed && !keywords.includes(trimmed)) setKeywords((p) => [...p, trimmed])
      setKeywordInput('')
    }
  }

  const isPending = saveDraftMutation.isPending || submitMutation.isPending

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/proposals/my')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Tạo Đề xuất Nghiên cứu"
          description="Tải lên đơn đăng ký để AI hỗ trợ điền thông tin, sau đó kiểm tra và nộp"
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepBadge step={1} current={step} />
        <span className={step === 1 ? 'font-medium' : 'text-muted-foreground'}>Tải lên đơn đăng ký</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepBadge step={2} current={step} />
        <span className={step === 2 ? 'font-medium' : 'text-muted-foreground'}>Thông tin đề xuất</span>
      </div>

      {/* ── STEP 1: Upload ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base gap-2 flex items-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Tải lên đơn đăng ký (AI sẽ đọc và điền tự động)
                </CardTitle>
                <CardDescription>
                  Tải file PDF hoặc DOCX của đơn đăng ký đề tài. AI sẽ đọc nội dung và điền thông tin vào form.
                  Bạn có thể chỉnh sửa trước khi nộp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />

                <div
                  className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <p className="text-sm font-medium">AI đang đọc file...</p>
                      <p className="text-xs text-muted-foreground">Gemini 2.5 Flash đang phân tích nội dung</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Kéo thả hoặc nhấn để tải lên</p>
                        <p className="text-sm text-muted-foreground mt-1">PDF, DOC, DOCX — tối đa 20MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {parseError && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {parseError}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={skipUpload} className="text-muted-foreground">
                    Bỏ qua, điền thủ công
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                    loading={isParsing}
                  >
                    <Upload className="h-4 w-4" />
                    Chọn file
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 2: Form ─────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* File indicator */}
            {uploadedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>Nguồn: <strong>{uploadedFile.name}</strong> — AI đã điền sẵn. Kiểm tra và chỉnh sửa nếu cần.</span>
                <Sparkles className="h-3.5 w-3.5 text-primary ml-auto flex-shrink-0" />
              </div>
            )}

            <form
              className="space-y-5"
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Section 1: Thông tin cơ bản */}
              <SectionCard number={1} icon={<BookOpen className="h-4 w-4" />} title="Thông tin cơ bản">
                <div className="space-y-1.5">
                  <Label>Tên đề tài (Tiếng Việt) *</Label>
                  <Input placeholder="Nghiên cứu và phát triển hệ thống..." {...register('titleVI')} />
                  {errors.titleVI && <p className="text-xs text-destructive">{errors.titleVI.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Tên đề tài (Tiếng Anh) *</Label>
                  <Input placeholder="Research and Development of..." {...register('titleEN')} />
                  {errors.titleEN && <p className="text-xs text-destructive">{errors.titleEN.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Chu kỳ nghiên cứu *</Label>
                    {cyclesLoading ? (
                      <Skeleton className="h-10 w-full rounded-md" />
                    ) : (
                      <Select {...register('cycleId')}>
                        <option value="">-- Chọn chu kỳ --</option>
                        {cycles.map((c) => (
                          <option key={c._id} value={c._id}>{c.name} {c.academicYear ? `(${c.academicYear})` : ''}</option>
                        ))}
                      </Select>
                    )}
                    {errors.cycleId && <p className="text-xs text-destructive">{errors.cycleId.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Lĩnh vực nghiên cứu</Label>
                    {tracksLoading && selectedCycleId ? (
                      <Skeleton className="h-10 w-full rounded-md" />
                    ) : (
                      <Select {...register('trackId')} disabled={!selectedCycleId || tracks.length === 0}>
                        <option value="">-- Chọn lĩnh vực --</option>
                        {tracks.map((t) => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>

                {/* Applied topic selection */}
                {isApplied && appliedTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Đề tài ứng dụng *</Label>
                    <Select {...register('appliedTopicId')}>
                      <option value="">-- Chọn đề tài --</option>
                      {appliedTopics.map((t) => (
                        <option key={t._id} value={t._id} disabled={t.currentSelections >= t.maxSelections && t.status === 'CLOSED'}>
                          {t.title} {t.topicType ? `[${t.topicType}]` : ''} — {t.currentSelections}/{t.maxSelections} nhóm
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-muted-foreground">Chu kỳ này yêu cầu chọn đề tài ứng dụng do Staff cung cấp</p>
                  </div>
                )}
              </SectionCard>

              {/* Section 2: Nội dung nghiên cứu */}
              <SectionCard number={2} icon={<AlignLeft className="h-4 w-4" />} title="Nội dung nghiên cứu">
                <div className="space-y-1.5">
                  <Label>Mục tiêu nghiên cứu *</Label>
                  <Textarea rows={4} placeholder="Mục tiêu của đề tài..." {...register('objectives')} />
                  {errors.objectives && <p className="text-xs text-destructive">{errors.objectives.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Phương pháp nghiên cứu *</Label>
                  <Textarea rows={4} placeholder="Phương pháp tiến hành nghiên cứu..." {...register('methodology')} />
                  {errors.methodology && <p className="text-xs text-destructive">{errors.methodology.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Sản phẩm dự kiến</Label>
                  <Textarea rows={3} placeholder="Các sản phẩm, kết quả dự kiến..." {...register('expectedOutput')} />
                </div>
              </SectionCard>

              {/* Section 3: Từ khóa */}
              <SectionCard number={3} icon={<Tag className="h-4 w-4" />} title="Từ khóa">
                <div className="space-y-2">
                  <Label>Từ khóa</Label>
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Nhập từ khóa và nhấn Enter..."
                  />
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                          {kw}
                          <button type="button" onClick={() => setKeywords((p) => p.filter((k) => k !== kw))}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Section 4: Ngân sách */}
              <SectionCard number={4} icon={<DollarSign className="h-4 w-4" />} title="Ngân sách & Thời gian">
                <div className="space-y-2">
                  <Label>Phương thức cấp kinh phí *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['LUMP_SUM', 'PARTIAL'] as const).map((v) => (
                      <label key={v} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" value={v} {...register('fundingMethod')} className="mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{v === 'LUMP_SUM' ? 'Một lần (Lump Sum)' : 'Nhiều đợt (Partial)'}</p>
                          <p className="text-xs text-muted-foreground">
                            {v === 'LUMP_SUM' ? 'Giải ngân toàn bộ một lần' : 'Giải ngân theo đợt nghiệm thu'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tổng kinh phí (VND) *</Label>
                    <Input type="number" placeholder="50000000" min={0} {...register('totalAmount')} />
                    {errors.totalAmount && <p className="text-xs text-destructive">{errors.totalAmount.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Thời gian thực hiện (tháng) *</Label>
                    <Input type="number" placeholder="12" min={1} max={60} {...register('durationMonths')} />
                    {errors.durationMonths && <p className="text-xs text-destructive">{errors.durationMonths.message}</p>}
                  </div>
                </div>
              </SectionCard>

              {/* Actions */}
              <div className="flex gap-3 justify-between pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    loading={saveDraftMutation.isPending}
                    disabled={isPending}
                    onClick={handleSubmit((d) => saveDraftMutation.mutate(d))}
                    className="gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    Lưu nháp
                  </Button>
                  <Button
                    type="button"
                    loading={submitMutation.isPending}
                    disabled={isPending}
                    onClick={handleSubmit((d) => submitMutation.mutate(d))}
                    className="gap-1.5"
                  >
                    <Send className="h-4 w-4" />
                    Nộp đề xuất
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
