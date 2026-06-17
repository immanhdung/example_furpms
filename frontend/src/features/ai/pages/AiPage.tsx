import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Search,
  Users,
  Brain,
  FileText,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Copy,
  Edit3,
  ChevronRight,
  Zap,
  Clock,
} from 'lucide-react'
import { aiApi } from '@/api/ai.api'
import type { AiRecommendation, ReviewerSuggestion, SearchResult } from '@/api/ai.api'
import { proposalsApi } from '@/api/proposals.api'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/auth.store'
import { formatNumber } from '@/lib/utils'
import type { Proposal } from '@/types'

const TABS = [
  { id: 'proposal', label: 'Tóm tắt Đề xuất', icon: FileText, roles: ['Admin', 'Staff', 'Faculty', 'ReviewCommittee'] },
  { id: 'report', label: 'Tóm tắt Báo cáo', icon: FileText, roles: ['Admin', 'Staff'] },
  { id: 'reviewers', label: 'Gợi ý Người phản biện', icon: Users, roles: ['Admin', 'Staff'] },
  { id: 'recommend', label: 'Khuyến nghị AI', icon: Brain, roles: ['Admin', 'Staff', 'ReviewCommittee'] },
  { id: 'search', label: 'Tìm kiếm Ngữ nghĩa', icon: Search, roles: ['Admin', 'Staff', 'Faculty', 'ReviewCommittee'] },
] as const

type TabId = (typeof TABS)[number]['id']

const slideVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const RECOMMENDATION_BADGE: Record<string, { label: string; color: string }> = {
  APPROVE: { label: 'Phê duyệt', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  REVISE: { label: 'Cần chỉnh sửa', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
  REJECT: { label: 'Từ chối', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
}

function MetaBadge({ cached, durationMs, tokens }: { cached?: boolean; durationMs?: number; tokens?: number }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {cached && (
        <span className="flex items-center gap-1 text-green-600">
          <Zap className="h-3 w-3" /> Cache hit
        </span>
      )}
      {durationMs != null && durationMs > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {durationMs}ms
        </span>
      )}
      {tokens != null && tokens > 0 && (
        <span>{formatNumber(tokens)} tokens</span>
      )}
    </div>
  )
}

// ── Tab: Proposal Summary ────────────────────────────────────────

function ProposalSummaryTab() {
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals-list-ai'],
    queryFn: () => proposalsApi.list({ limit: 100 }),
    staleTime: 60_000,
  })
  const proposals: Proposal[] = (proposalsData?.data?.data as { items?: Proposal[] })?.items ?? []

  const summarizeMutation = useMutation({
    mutationFn: ({ id, noCache }: { id: string; noCache: boolean }) =>
      aiApi.summarizeProposal(id, noCache),
    onSuccess: () => toast.success('Đã tạo tóm tắt AI', 'Tóm tắt được lưu vào đề xuất'),
    onError: () => toast.error('Không thể tạo tóm tắt', 'Kiểm tra kết nối hoặc thử lại'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      aiApi.editProposalSummary(id, text),
    onSuccess: () => {
      toast.success('Đã lưu chỉnh sửa')
      setEditing(false)
    },
    onError: () => toast.error('Không thể lưu chỉnh sửa'),
  })

  const result = summarizeMutation.data?.data?.data

  const handleCopy = () => {
    const text = result?.summary ?? ''
    if (text) {
      void navigator.clipboard.writeText(text)
      toast.success('Đã sao chép')
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Chọn đề xuất để tóm tắt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Đề xuất nghiên cứu</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value)
                summarizeMutation.reset()
                setEditing(false)
              }}
            >
              <option value="">-- Chọn đề xuất --</option>
              {proposals.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.titleVI}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => summarizeMutation.mutate({ id: selectedId, noCache: false })}
              disabled={!selectedId || summarizeMutation.isPending}
            >
              {summarizeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Tạo tóm tắt AI
            </Button>
            <Button
              variant="outline"
              onClick={() => summarizeMutation.mutate({ id: selectedId, noCache: true })}
              disabled={!selectedId || summarizeMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tạo lại
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {summarizeMutation.isPending && (
          <motion.div key="loading" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Gemini đang phân tích đề xuất...</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {result?.summary && !summarizeMutation.isPending && (
          <motion.div key="result" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Kết quả tóm tắt</CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(true)
                      setEditText(result.summary ?? '')
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaBadge cached={result.cached} durationMs={result.durationMs} tokens={result.tokensTotal} />
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={10}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => editMutation.mutate({ id: selectedId, text: editText })}
                        disabled={editMutation.isPending}
                      >
                        {editMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                        Lưu
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {result.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {summarizeMutation.isError && (
          <motion.div key="error" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <Card className="border-destructive/50">
              <CardContent className="p-5 flex items-center gap-3 text-destructive">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">Không thể tạo tóm tắt. Vui lòng kiểm tra kết nối API Gemini.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Tab: Reviewer Suggestions ───────────────────────────────────

function ReviewerSuggestionsTab() {
  const [selectedId, setSelectedId] = useState('')

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals-list-ai'],
    queryFn: () => proposalsApi.list({ limit: 100 }),
    staleTime: 60_000,
  })
  const proposals: Proposal[] = (proposalsData?.data?.data as { items?: Proposal[] })?.items ?? []

  const suggestMutation = useMutation({
    mutationFn: ({ id, noCache }: { id: string; noCache: boolean }) =>
      aiApi.suggestReviewers(id, noCache),
    onSuccess: () => toast.success('Đã tạo gợi ý người phản biện'),
    onError: () => toast.error('Không thể tạo gợi ý'),
  })

  const suggestions = (suggestMutation.data?.data?.data ?? []) as ReviewerSuggestion[]

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Đề xuất nghiên cứu</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); suggestMutation.reset() }}
            >
              <option value="">-- Chọn đề xuất --</option>
              {proposals.map((p) => (
                <option key={p._id} value={p._id}>{p.titleVI}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => suggestMutation.mutate({ id: selectedId, noCache: false })}
              disabled={!selectedId || suggestMutation.isPending}
            >
              {suggestMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
              Gợi ý người phản biện
            </Button>
            <Button variant="outline" onClick={() => suggestMutation.mutate({ id: selectedId, noCache: true })} disabled={!selectedId || suggestMutation.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" /> Tạo lại
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {suggestMutation.isPending && (
          <motion.div key="loading" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-52" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {suggestions.length > 0 && !suggestMutation.isPending && (
          <motion.div key="results" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <div className="space-y-3">
              {suggestions.map((reviewer, i) => (
                <motion.div
                  key={reviewer._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{reviewer.fullName}</p>
                            {reviewer.department && (
                              <Badge variant="outline" className="text-xs">{reviewer.department}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{reviewer.email}</p>
                          <p className="text-xs text-foreground/80 italic">{reviewer.reason}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.round(reviewer.score * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-primary">{Math.round(reviewer.score * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Tab: AI Recommendation ──────────────────────────────────────

function RecommendationTab() {
  const [selectedId, setSelectedId] = useState('')

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals-list-ai'],
    queryFn: () => proposalsApi.list({ limit: 100 }),
    staleTime: 60_000,
  })
  const proposals: Proposal[] = (proposalsData?.data?.data as { items?: Proposal[] })?.items ?? []

  const recommendMutation = useMutation({
    mutationFn: ({ id, noCache }: { id: string; noCache: boolean }) =>
      aiApi.getRecommendation(id, noCache),
    onSuccess: () => toast.success('Đã tạo khuyến nghị AI'),
    onError: () => toast.error('Không thể tạo khuyến nghị'),
  })

  const result = recommendMutation.data?.data?.data as AiRecommendation | undefined
  const s = result?.structured
  const badge = s ? RECOMMENDATION_BADGE[s.overall] : null

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Đề xuất nghiên cứu</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); recommendMutation.reset() }}
            >
              <option value="">-- Chọn đề xuất --</option>
              {proposals.map((p) => (
                <option key={p._id} value={p._id}>{p.titleVI}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => recommendMutation.mutate({ id: selectedId, noCache: false })}
            disabled={!selectedId || recommendMutation.isPending}
          >
            {recommendMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            Phân tích & Khuyến nghị
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {recommendMutation.isPending && (
          <motion.div key="loading" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Gemini đang phân tích toàn diện đề xuất...</span>
                </div>
                {[...Array(6)].map((_, i) => <Skeleton key={i} className={`h-4 w-${['full', '5/6', '4/5', 'full', '3/4', '5/6'][i]}`} />)}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {s && !recommendMutation.isPending && (
          <motion.div key="result" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <div className="space-y-4">
              {/* Overall verdict */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {s.overall === 'APPROVE' && <CheckCircle className="h-6 w-6 text-green-600" />}
                      {s.overall === 'REVISE' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                      {s.overall === 'REJECT' && <XCircle className="h-6 w-6 text-red-600" />}
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Khuyến nghị tổng thể</p>
                        {badge && (
                          <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{s.score}</p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                  </div>
                  <div className="bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${s.score}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <MetaBadge cached={result?.cached} tokens={result?.tokensTotal} />
                  {s.summary && (
                    <p className="text-sm leading-relaxed text-foreground/80 mt-3 p-3 bg-muted/50 rounded-lg">{s.summary}</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Strengths */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Điểm mạnh
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {s.strengths.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" /> Hạn chế
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {s.weaknesses.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-red-600 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Gợi ý cải thiện
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {s.suggestions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Budget & Timeline */}
              {(s.budgetAssessment || s.timelineAssessment) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Đánh giá ngân sách</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/80">{s.budgetAssessment}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Đánh giá tiến độ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/80">{s.timelineAssessment}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Tab: Semantic Search ─────────────────────────────────────────

function SemanticSearchTab() {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(10)

  const searchMutation = useMutation({
    mutationFn: () => aiApi.searchSemantic(query, limit),
    onError: () => toast.error('Không thể thực hiện tìm kiếm'),
  })

  const results = (searchMutation.data?.data?.data ?? []) as SearchResult[]

  const STATUS_COLORS: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-query">Truy vấn tìm kiếm ngữ nghĩa</Label>
            <div className="flex gap-2">
              <Input
                id="search-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="vd: nghiên cứu trí tuệ nhân tạo trong giáo dục..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    searchMutation.mutate()
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => searchMutation.mutate()}
                disabled={!query.trim() || searchMutation.isPending}
              >
                {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tìm kiếm ngữ nghĩa sử dụng MongoDB Atlas Vector Search + Google text-embedding-004
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Số kết quả:</Label>
            {[5, 10, 20].map((n) => (
              <Button
                key={n}
                variant={limit === n ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setLimit(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {searchMutation.isPending && (
          <motion.div key="loading" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {results.length > 0 && !searchMutation.isPending && (
          <motion.div key="results" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{results.length} kết quả phù hợp nhất</p>
              {results.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{r.titleVI}</p>
                          {r.titleEN && <p className="text-xs text-muted-foreground truncate">{r.titleEN}</p>}
                          {r.aiSummary && (
                            <p className="text-xs text-foreground/70 mt-1.5 line-clamp-2">{r.aiSummary}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {r.status}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {(r.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {searchMutation.isSuccess && results.length === 0 && !searchMutation.isPending && (
          <motion.div key="empty" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Không tìm thấy đề xuất phù hợp với truy vấn này</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────

export function AiPage() {
  const { user } = useAuthStore()
  const userRoles = user?.roles ?? []
  const [activeTab, setActiveTab] = useState<TabId>('proposal')

  const visibleTabs = TABS.filter((t) =>
    t.roles.some((r) => userRoles.includes(r)),
  )

  const ActiveComponent = {
    proposal: ProposalSummaryTab,
    report: ProposalSummaryTab, // placeholder — uses same pattern
    reviewers: ReviewerSuggestionsTab,
    recommend: RecommendationTab,
    search: SemanticSearchTab,
  }[activeTab] ?? ProposalSummaryTab

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tính năng AI"
        description="Phân tích đề xuất nghiên cứu với Google Gemini 2.5 Flash"
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Powered by Gemini 2.5 Flash</span>
          </div>
        }
      />

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'proposal' && <ProposalSummaryTab />}
          {activeTab === 'report' && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chọn một báo cáo tổng kết từ trang Báo cáo Tổng kết và nhấn "Tóm tắt AI"</p>
              </CardContent>
            </Card>
          )}
          {activeTab === 'reviewers' && <ReviewerSuggestionsTab />}
          {activeTab === 'recommend' && <RecommendationTab />}
          {activeTab === 'search' && <SemanticSearchTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
