import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Send, CheckCircle, XCircle, RefreshCw, Trash2, Edit,
  Sparkles, FileText, Clock, User, DollarSign, Calendar,
} from 'lucide-react'
import { proposalsApi } from '@/api/proposals.api'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Proposal, Cycle, User as UserType } from '@/types'

const proposalStatusMap: Record<
  Proposal['status'],
  { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'outline' }
> = {
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  SUBMITTED: { label: 'Chờ xét duyệt', variant: 'info' },
  UNDER_REVIEW: { label: 'Đang phản biện', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' },
  REVISION_REQUIRED: { label: 'Yêu cầu chỉnh sửa', variant: 'warning' },
  CONTRACTED: { label: 'Đã ký hợp đồng', variant: 'default' },
  IN_PROGRESS: { label: 'Đang thực hiện', variant: 'info' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  TERMINATED: { label: 'Chấm dứt', variant: 'destructive' },
}

const fundingMethodLabel: Record<Proposal['fundingMethod'], string> = {
  LUMP_SUM: 'Một lần (Lump Sum)',
  PARTIAL: 'Nhiều đợt (Partial)',
}

interface InfoRowProps {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      {icon && <div className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 w-80 rounded-lg" />
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-2 border-b last:border-0">
              <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function getPIName(pi: Proposal['piId']): string {
  if (typeof pi === 'string') return pi
  return (pi as UserType).fullName
}

function getCycleName(cycle: Proposal['cycleId']): string {
  if (typeof cycle === 'string') return cycle
  return (cycle as Cycle).name
}

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const isStaff = useAuthStore((s) => s.isStaff())
  const isFaculty = useAuthStore((s) => s.isFaculty())

  const [aiSummary, setAiSummary] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['proposals', id],
    queryFn: () => proposalsApi.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const proposal = data?.data?.data

  const submitMutation = useMutation({
    mutationFn: () => proposalsApi.submit(id!),
    onSuccess: () => {
      toast.success('Nộp đề xuất thành công')
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
      queryClient.invalidateQueries({ queryKey: ['proposals', 'my'] })
    },
    onError: () => toast.error('Không thể nộp đề xuất'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => proposalsApi.delete(id!),
    onSuccess: () => {
      toast.success('Đã xóa đề xuất')
      navigate('/proposals/my')
    },
    onError: () => toast.error('Không thể xóa đề xuất'),
  })

  const sendToReviewMutation = useMutation({
    mutationFn: () => proposalsApi.update(id!, { status: 'UNDER_REVIEW' }),
    onSuccess: () => {
      toast.success('Đã gửi đề xuất đến hội đồng phản biện')
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
    onError: () => toast.error('Không thể gửi đề xuất'),
  })

  const approveMutation = useMutation({
    mutationFn: () => proposalsApi.update(id!, { status: 'APPROVED' }),
    onSuccess: () => {
      toast.success('Đã phê duyệt đề xuất')
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
    onError: () => toast.error('Không thể phê duyệt'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => proposalsApi.update(id!, { status: 'REJECTED' }),
    onSuccess: () => {
      toast.success('Đã từ chối đề xuất')
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
    onError: () => toast.error('Không thể từ chối'),
  })

  const summarizeMutation = useMutation({
    mutationFn: () => proposalsApi.summarize(id!),
    onSuccess: (res) => {
      setAiSummary(res.data.data.summary)
      toast.success('Tạo tóm tắt AI thành công')
    },
    onError: () => toast.error('Không thể tạo tóm tắt AI'),
  })

  if (isLoading) return <SkeletonDetail />
  if (isError || !proposal) return <ErrorState onRetry={() => void refetch()} />

  const status = proposalStatusMap[proposal.status]
  const isDraft = proposal.status === 'DRAFT'
  const isSubmitted = proposal.status === 'SUBMITTED'
  const isAdminOrStaff = isAdmin || isStaff

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="flex-shrink-0 mt-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader
            title={proposal.titleVI}
            description={proposal.titleEN}
            actions={<Badge variant={status.variant} className="text-sm px-3 py-1">{status.label}</Badge>}
          />
        </div>
      </div>

      {/* Action bar */}
      <motion.div
        className="flex flex-wrap gap-2 p-4 rounded-xl border bg-muted/30"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Admin/Staff actions */}
        {isAdminOrStaff && (
          <>
            {isSubmitted && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                loading={sendToReviewMutation.isPending}
                onClick={() => sendToReviewMutation.mutate()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Gửi phản biện
              </Button>
            )}
            {(proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW') && (
              <>
                <Button
                  size="sm"
                  className="gap-1.5 bg-green-600 hover:bg-green-700"
                  loading={approveMutation.isPending}
                  onClick={() => approveMutation.mutate()}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Phê duyệt
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  loading={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate()}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Từ chối
                </Button>
              </>
            )}
          </>
        )}

        {/* Faculty actions */}
        {isFaculty && (
          <>
            {isDraft && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/proposals/create`)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  loading={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  <Send className="h-3.5 w-3.5" />
                  Nộp đề xuất
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa đề xuất này?')) deleteMutation.mutate()
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </Button>
              </>
            )}
          </>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">
            <FileText className="h-4 w-4 mr-1.5" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-1.5" />
            Lịch sử
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-1.5" />
            AI Tóm tắt
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Thông tin chung</CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-6 pb-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Chủ nhiệm đề tài"
                  value={getPIName(proposal.piId)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Chu kỳ nghiên cứu"
                  value={getCycleName(proposal.cycleId)}
                />
                <InfoRow
                  label="Thời gian thực hiện"
                  value={`${proposal.duration} tháng`}
                />
                <InfoRow
                  label="Từ khóa"
                  value={
                    proposal.keywords?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {proposal.keywords.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-muted rounded-full text-xs">{kw}</span>
                        ))}
                      </div>
                    ) : '—'
                  }
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Ngày tạo"
                  value={formatDate(proposal.createdAt)}
                />
                {proposal.submittedAt && (
                  <InfoRow
                    label="Ngày nộp"
                    value={formatDate(proposal.submittedAt)}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Ngân sách</CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-6 pb-4">
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Tổng kinh phí"
                  value={<span className="font-mono text-lg text-primary">{formatCurrency(proposal.totalAmount)}</span>}
                />
                <InfoRow
                  label="Phương thức cấp"
                  value={fundingMethodLabel[proposal.fundingMethod]}
                />
              </CardContent>
            </Card>

            {proposal.abstract && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Tóm tắt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{proposal.abstract}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="relative pl-4">
                  {/* Timeline item: created */}
                  <div className="relative flex gap-4 pb-6">
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-muted-foreground -translate-x-1/2" />
                    <div className="ml-4">
                      <p className="text-sm font-medium">Đề xuất được tạo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(proposal.createdAt)}</p>
                    </div>
                  </div>

                  {proposal.submittedAt && (
                    <div className="relative flex gap-4 pb-6">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 -translate-x-1/2" />
                      <div className="ml-4">
                        <p className="text-sm font-medium">Nộp đề xuất</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(proposal.submittedAt)}</p>
                      </div>
                    </div>
                  )}

                  {proposal.status === 'APPROVED' && (
                    <div className="relative flex gap-4 pb-6">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-green-500 -translate-x-1/2" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Được phê duyệt</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(proposal.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {proposal.status === 'REJECTED' && (
                    <div className="relative flex gap-4">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-destructive -translate-x-1/2" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-destructive">Bị từ chối</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(proposal.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* AI Summary Tab */}
        <TabsContent value="ai" className="mt-4">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Tóm tắt bằng AI (Gemini)
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    loading={summarizeMutation.isPending}
                    onClick={() => summarizeMutation.mutate()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {aiSummary ? 'Tạo lại' : 'Tạo tóm tắt'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {summarizeMutation.isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : aiSummary ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{aiSummary}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-4 mb-3">
                      <Sparkles className="h-6 w-6 text-purple-500" />
                    </div>
                    <p className="text-sm font-medium mb-1">Chưa có tóm tắt AI</p>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                      Nhấn "Tạo tóm tắt" để AI phân tích và tóm tắt nội dung đề xuất của bạn.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
