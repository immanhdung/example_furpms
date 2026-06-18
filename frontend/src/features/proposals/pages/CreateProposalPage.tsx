import { useState, useRef } from 'react'
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
  ChevronRight, CalendarDays, List,
} from 'lucide-react'
import { proposalsApi } from '@/api/proposals.api'
import { cyclesApi } from '@/api/cycles.api'
import { researchTypesApi } from '@/api/researchTypes.api'
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
import { formatDate } from '@/lib/utils'
import apiClient from '@/api/client'
import type { ApiResponse, Cycle, Track, AppliedTopic, ResearchType } from '@/types'

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

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Chọn chu kỳ' },
  { n: 2, label: 'Chọn đề tài' },
  { n: 3, label: 'Upload & Điền thông tin' },
]

function StepIndicator({ current, hasTopics }: { current: number; hasTopics: boolean }) {
  const steps = hasTopics ? STEPS : STEPS.filter((s) => s.n !== 2).map((s, i) => ({ ...s, display: i + 1 }))
  return (
    <div className="flex items-center gap-2 text-sm">
      {STEPS.filter((s) => hasTopics || s.n !== 2).map((s, idx, arr) => {
        const displayN = idx + 1
        const done = current > s.n
        const active = current === s.n
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border-2 transition-colors flex-shrink-0 ${
              done ? 'bg-primary border-primary text-primary-foreground' :
              active ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
            }`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : displayN}
            </div>
            <span className={active ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
            {idx < arr.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Cycle info card ──────────────────────────────────────────────────────────

function CycleInfoCard({ cycle }: { cycle: Cycle }) {
  const rt = typeof cycle.researchTypeId === 'object' ? cycle.researchTypeId as ResearchType : null
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{cycle.name}</p>
        {rt && (
          <Badge variant="outline" className="text-xs font-mono">{rt.code}</Badge>
        )}
      </div>
      {rt && <p className="text-xs text-muted-foreground">Loại: {rt.name}</p>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {cycle.submissionStart && <span>Nhận hồ sơ từ: {formatDate(cycle.submissionStart)}</span>}
        {cycle.submissionEnd && <span>Hạn nộp: {formatDate(cycle.submissionEnd)}</span>}
        {cycle.reviewStart && <span>Xét duyệt từ: {formatDate(cycle.reviewStart)}</span>}
        {cycle.reviewEnd && <span>Kết thúc xét duyệt: {formatDate(cycle.reviewEnd)}</span>}
      </div>
      {cycle.description && <p className="text-xs text-muted-foreground">{cycle.description}</p>}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CreateProposalPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [selectedCycleId, setSelectedCycleId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [formReady, setFormReady] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { fundingMethod: 'LUMP_SUM', cycleId: '' },
  })

  // Fetch open cycles
  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['cycles-open'],
    queryFn: () => cyclesApi.list({ limit: 100, status: 'OPEN' }),
    staleTime: 60_000,
  })
  const cycles: Cycle[] = cyclesData?.data?.data?.items ?? []
  const selectedCycle = cycles.find((c) => c._id === selectedCycleId)

  // Get researchTypeId from selected cycle
  const researchTypeId = selectedCycle
    ? (typeof selectedCycle.researchTypeId === 'object'
      ? (selectedCycle.researchTypeId as ResearchType)._id
      : selectedCycle.researchTypeId)
    : undefined

  // Fetch topics for this research type
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['research-type-topics', researchTypeId],
    queryFn: () => researchTypesApi.getTopics(researchTypeId!),
    enabled: !!researchTypeId,
    staleTime: 60_000,
  })
  const topics: AppliedTopic[] = topicsData?.data?.data ?? []
  const hasTopics = topics.length > 0

  // Fetch tracks
  const { data: tracksData } = useQuery({
    queryKey: ['cycle-tracks', selectedCycleId],
    queryFn: () => cyclesApi.getTracks(selectedCycleId),
    enabled: !!selectedCycleId,
    staleTime: 60_000,
  })
  const tracks: Track[] = tracksData?.data?.data ?? []

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

  // Step 1 → 2/3
  const handleCycleNext = () => {
    if (!selectedCycleId) { toast.error('Vui lòng chọn chu kỳ'); return }
    setValue('cycleId', selectedCycleId)
    if (hasTopics) setStep(2)
    else setStep(3)
  }

  // Step 2 → 3
  const handleTopicNext = () => {
    if (selectedTopicId) setValue('appliedTopicId', selectedTopicId)
    setStep(3)
  }

  // File upload + AI parse
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
    } catch {
      setParseError('Không thể phân tích file. Vui lòng điền thủ công.')
    } finally {
      setIsParsing(false)
      setFormReady(true)
    }
    e.target.value = ''
  }

  const skipUpload = () => { setFormReady(true) }

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = keywordInput.trim()
      if (trimmed && !keywords.includes(trimmed)) setKeywords((p) => [...p, trimmed])
      setKeywordInput('')
    }
  }

  const isPending = saveDraftMutation.isPending || submitMutation.isPending
  const selectedTopic = topics.find((t) => t._id === selectedTopicId)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/proposals/my')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Tạo Đề xuất Nghiên cứu"
          description="Chọn chu kỳ, đề tài, tải lên đơn đăng ký và nộp đề xuất"
        />
      </div>

      <StepIndicator current={step} hasTopics={hasTopics} />

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Select cycle ─────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Chọn chu kỳ nghiên cứu
                </CardTitle>
                <CardDescription>Chọn chu kỳ bạn muốn nộp đề xuất</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cyclesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                  </div>
                ) : cycles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Không có chu kỳ nghiên cứu đang mở
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cycles.map((cycle) => {
                      const rt = typeof cycle.researchTypeId === 'object'
                        ? cycle.researchTypeId as ResearchType : null
                      return (
                        <button
                          key={cycle._id}
                          type="button"
                          onClick={() => setSelectedCycleId(cycle._id)}
                          className={`w-full text-left rounded-lg border p-4 transition-colors ${
                            selectedCycleId === cycle._id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{cycle.name}</p>
                              {rt && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Loại: <span className="font-mono">{rt.code}</span> — {rt.name}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-muted-foreground">
                                {cycle.submissionEnd && (
                                  <span>Hạn nộp: {formatDate(cycle.submissionEnd)}</span>
                                )}
                                {cycle.academicYear && (
                                  <span>Năm học: {cycle.academicYear}</span>
                                )}
                              </div>
                            </div>
                            {selectedCycleId === cycle._id && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedCycle && <CycleInfoCard cycle={selectedCycle} />}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleCycleNext}
                disabled={!selectedCycleId || topicsLoading}
              >
                {topicsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Tiếp theo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Select topic ─────────────────────────────────── */}
        {step === 2 && hasTopics && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" />
                  Chọn đề tài đặt hàng
                </CardTitle>
                <CardDescription>
                  Chu kỳ này có danh sách đề tài đặt hàng. Vui lòng chọn đề tài phù hợp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topics.map((topic) => (
                  <button
                    key={topic._id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic._id)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors ${
                      selectedTopicId === topic._id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-snug">{topic.title}</p>
                        {topic.orderingUnit && (
                          <p className="text-xs text-muted-foreground mt-1">Đơn vị: {topic.orderingUnit}</p>
                        )}
                        {topic.area && (
                          <p className="text-xs text-muted-foreground">Khu vực: {topic.area}</p>
                        )}
                        {topic.objectives && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{topic.objectives}</p>
                        )}
                      </div>
                      {selectedTopicId === topic._id && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
              <Button onClick={handleTopicNext} disabled={!selectedTopicId}>
                Tiếp theo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Upload + Form ─────────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            {/* Upload zone (only shown before formReady) */}
            {!formReady && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Tải lên đơn đăng ký (AI sẽ đọc tự động)
                  </CardTitle>
                  <CardDescription>
                    Tải file PDF hoặc DOCX. AI sẽ đọc và điền thông tin vào form. Bạn có thể bỏ qua.
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
                    onClick={() => !isParsing && fileInputRef.current?.click()}
                  >
                    {isParsing ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-sm font-medium">AI đang đọc file...</p>
                        <p className="text-xs text-muted-foreground">Gemini 2.5 Flash đang phân tích</p>
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
                  <div className="flex justify-between items-center pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={skipUpload} className="text-muted-foreground">
                      Bỏ qua, điền thủ công
                    </Button>
                    <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                      <Upload className="h-4 w-4" /> Chọn file
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form (shown after upload/skip) */}
            {formReady && (
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {/* Source indicator */}
                {uploadedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>Nguồn: <strong>{uploadedFile.name}</strong> — AI đã điền. Kiểm tra và chỉnh sửa nếu cần.</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary ml-auto flex-shrink-0" />
                  </div>
                )}

                {/* Selected topic summary */}
                {selectedTopic && (
                  <div className="flex items-start gap-2 text-sm bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{selectedTopic.title}</p>
                      {selectedTopic.orderingUnit && (
                        <p className="text-xs text-muted-foreground mt-0.5">Đơn vị: {selectedTopic.orderingUnit}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 1 */}
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
                  <div className="space-y-1.5">
                    <Label>Lĩnh vực nghiên cứu</Label>
                    <Select {...register('trackId')} disabled={tracks.length === 0}>
                      <option value="">-- Chọn lĩnh vực --</option>
                      {tracks.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </Select>
                  </div>
                </SectionCard>

                {/* Section 2 */}
                <SectionCard number={2} icon={<AlignLeft className="h-4 w-4" />} title="Nội dung nghiên cứu">
                  <div className="space-y-1.5">
                    <Label>Mục tiêu nghiên cứu *</Label>
                    <Textarea rows={4} placeholder="Mục tiêu của đề tài..." {...register('objectives')} />
                    {errors.objectives && <p className="text-xs text-destructive">{errors.objectives.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phương pháp nghiên cứu *</Label>
                    <Textarea rows={4} placeholder="Phương pháp tiến hành..." {...register('methodology')} />
                    {errors.methodology && <p className="text-xs text-destructive">{errors.methodology.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sản phẩm dự kiến</Label>
                    <Textarea rows={3} placeholder="Các sản phẩm, kết quả dự kiến..." {...register('expectedOutput')} />
                  </div>
                </SectionCard>

                {/* Section 3: Keywords */}
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

                {/* Section 4: Budget */}
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
                  <Button type="button" variant="outline" onClick={() => { setFormReady(false); setStep(hasTopics ? 2 : 1) }}>
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      loading={saveDraftMutation.isPending}
                      disabled={isPending}
                      onClick={handleSubmit((d) => saveDraftMutation.mutate(d))}
                    >
                      <Save className="h-4 w-4" /> Lưu nháp
                    </Button>
                    <Button
                      type="button"
                      loading={submitMutation.isPending}
                      disabled={isPending}
                      onClick={handleSubmit((d) => submitMutation.mutate(d))}
                    >
                      <Send className="h-4 w-4" /> Nộp đề xuất
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
