import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  ChevronRight,
  X,
  UserPlus,
  Shield,
  Calendar,
  Gavel,
  ExternalLink,
  Video,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { councilsApi } from '@/api/councils.api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import type { Council, CouncilMember, User } from '@/types'

const COUNCIL_TYPE_LABELS: Record<string, string> = {
  SCREENING: 'Hội đồng Sơ loại',
  REVIEW: 'Hội đồng Xét duyệt',
  ACCEPTANCE: 'Hội đồng Nghiệm thu',
}

const MEMBER_ROLE_LABELS: Record<string, string> = {
  CHAIRMAN: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  MEMBER: 'Thành viên',
  ORDERING_PARTY_REP: 'Đại diện đặt hàng',
}

const MEMBER_ROLE_COLORS: Record<string, string> = {
  CHAIRMAN: 'bg-amber-100 text-amber-700 border-amber-200',
  SECRETARY: 'bg-blue-100 text-blue-700 border-blue-200',
  MEMBER: 'bg-gray-100 text-gray-700 border-gray-200',
  ORDERING_PARTY_REP: 'bg-orange-100 text-orange-700 border-orange-200',
}

interface CouncilWithPopulated extends Omit<Council, 'proposalId'> {
  proposalId: {
    _id: string
    titleVI: string
  }
}

interface CouncilMemberWithUser extends CouncilMember {
  userId: User
}

function TableSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b">
          <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function MemberRow({ member }: { member: CouncilMemberWithUser }) {
  const user = member.userId
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user?.fullName ?? 'Unknown'}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
      </div>
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${MEMBER_ROLE_COLORS[member.memberRole] ?? 'bg-gray-100 text-gray-700'}`}
      >
        {MEMBER_ROLE_LABELS[member.memberRole] ?? member.memberRole}
      </span>
      {member.isExternal && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <ExternalLink className="h-3 w-3" />
          Ngoài
        </span>
      )}
    </div>
  )
}

function CouncilDetailPanel({
  council,
  onClose,
  canManage,
}: {
  council: CouncilWithPopulated
  onClose: () => void
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [showAddMember, setShowAddMember] = useState(false)
  const [addForm, setAddForm] = useState({ userId: '', memberRole: 'MEMBER', isExternal: false })
  const [addError, setAddError] = useState('')

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['council-members', council._id],
    queryFn: () => councilsApi.getMembers(council._id).then((r) => r.data.data),
    staleTime: 30_000,
  })

  const addMutation = useMutation({
    mutationFn: () =>
      councilsApi.addMember(council._id, {
        userId: addForm.userId,
        memberRole: addForm.memberRole,
        isExternal: addForm.isExternal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['council-members', council._id] })
      queryClient.invalidateQueries({ queryKey: ['councils'] })
      setShowAddMember(false)
      setAddForm({ userId: '', memberRole: 'MEMBER', isExternal: false })
      setAddError('')
    },
    onError: () => setAddError('Không thể thêm thành viên. Vui lòng thử lại.'),
  })

  const confirmMutation = useMutation({
    mutationFn: () => councilsApi.confirmResult(council._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['councils'] })
      queryClient.invalidateQueries({ queryKey: ['council-members', council._id] })
      toast.success('Đã xác nhận kết quả hội đồng')
    },
    onError: () => toast.error('Không thể xác nhận kết quả'),
  })

  const members = (membersData ?? []) as CouncilMemberWithUser[]

  const myMemberRecord = members.find((m) => {
    const uid = typeof m.userId === 'string' ? m.userId : (m.userId as User)?._id
    return uid === user?.sub
  })
  const myMemberRole = myMemberRecord?.memberRole ?? ''
  const isChairman = myMemberRole === 'CHAIRMAN'
  const canAddMember =
    !council.isResultConfirmed &&
    (canManage || isChairman || myMemberRole === 'SECRETARY')
  const canConfirmResult = isChairman && !council.isResultConfirmed

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b bg-muted/20">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
              <Gavel className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              {COUNCIL_TYPE_LABELS[council.councilType] ?? council.councilType}
            </span>
          </div>
          <h2 className="text-sm font-semibold leading-snug line-clamp-2">
            {(council.proposalId as { titleVI?: string })?.titleVI ?? 'Đề xuất'}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={council.status} />
            {council.meetingDeadline && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(council.meetingDeadline)}
              </span>
            )}
          </div>
          {council.meetLink && (
            <a
              href={council.meetLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
            >
              <Video className="h-3 w-3" />
              Google Meet
            </a>
          )}
          {council.isResultConfirmed && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Kết quả đã xác nhận
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Thành viên Hội đồng
            {!membersLoading && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {members.length}
              </span>
            )}
          </h3>
          {canAddMember && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setShowAddMember(true)}
            >
              <UserPlus className="h-3 w-3" />
              Thêm
            </Button>
          )}
        </div>

        {membersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            title="Chưa có thành viên"
            description="Hội đồng này chưa có thành viên nào được thêm vào."
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="space-y-1">
            {members.map((member, i) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MemberRow member={member} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chairman confirm result footer */}
      {canConfirmResult && (
        <div className="p-4 border-t bg-muted/10">
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            {confirmMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận kết quả hội đồng'}
          </Button>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Thành viên Hội đồng</DialogTitle>
          </DialogHeader>
          <DialogClose onClose={() => setShowAddMember(false)} />
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="addUserId">ID Người dùng</Label>
              <Input
                id="addUserId"
                placeholder="Nhập ID người dùng..."
                value={addForm.userId}
                onChange={(e) => setAddForm((f) => ({ ...f, userId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addMemberRole">Vai trò</Label>
              <select
                id="addMemberRole"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={addForm.memberRole}
                onChange={(e) => setAddForm((f) => ({ ...f, memberRole: e.target.value }))}
              >
                <option value="CHAIRMAN">Chủ tịch</option>
                <option value="SECRETARY">Thư ký</option>
                <option value="MEMBER">Thành viên</option>
                <option value="ORDERING_PARTY_REP">Đại diện đặt hàng</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isExternal"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={addForm.isExternal}
                onChange={(e) => setAddForm((f) => ({ ...f, isExternal: e.target.checked }))}
              />
              <Label htmlFor="isExternal" className="font-normal cursor-pointer">
                Thành viên bên ngoài (phản biện)
              </Label>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!addForm.userId || addMutation.isPending}
            >
              {addMutation.isPending ? 'Đang thêm...' : 'Thêm thành viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function CreateCouncilDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    proposalId: '',
    councilType: 'REVIEW',
    councilStage: 'PROPOSAL',
    establishmentDecisionNo: '',
    meetingDeadline: '',
    meetLink: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => councilsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['councils'] })
      onOpenChange(false)
      setForm({
        proposalId: '',
        councilType: 'REVIEW',
        councilStage: 'PROPOSAL',
        establishmentDecisionNo: '',
        meetingDeadline: '',
        meetLink: '',
      })
      setError('')
    },
    onError: () => setError('Không thể tạo hội đồng. Vui lòng thử lại.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo Hội đồng Mới</DialogTitle>
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cProposalId">ID Đề xuất</Label>
            <Input
              id="cProposalId"
              placeholder="Nhập ID đề xuất..."
              value={form.proposalId}
              onChange={(e) => setForm((f) => ({ ...f, proposalId: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cCouncilType">Loại Hội đồng</Label>
            <select
              id="cCouncilType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.councilType}
              onChange={(e) => setForm((f) => ({ ...f, councilType: e.target.value }))}
            >
              <option value="SCREENING">Hội đồng Sơ loại</option>
              <option value="REVIEW">Hội đồng Xét duyệt</option>
              <option value="ACCEPTANCE">Hội đồng Nghiệm thu</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cCouncilStage">Giai đoạn</Label>
            <select
              id="cCouncilStage"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.councilStage}
              onChange={(e) => setForm((f) => ({ ...f, councilStage: e.target.value }))}
            >
              <option value="PROPOSAL">Xét duyệt đề xuất</option>
              <option value="FINAL_REPORT">Nghiệm thu báo cáo cuối</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cDecisionNo">Số quyết định thành lập</Label>
            <Input
              id="cDecisionNo"
              placeholder="VD: QĐ-2024-001"
              value={form.establishmentDecisionNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, establishmentDecisionNo: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cMeetingDeadline">Hạn họp xét duyệt</Label>
            <Input
              id="cMeetingDeadline"
              type="date"
              value={form.meetingDeadline}
              onChange={(e) => setForm((f) => ({ ...f, meetingDeadline: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cMeetLink">Link Google Meet (tùy chọn)</Label>
            <Input
              id="cMeetLink"
              placeholder="https://meet.google.com/..."
              value={form.meetLink}
              onChange={(e) => setForm((f) => ({ ...f, meetLink: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.proposalId || mutation.isPending}
          >
            {mutation.isPending ? 'Đang tạo...' : 'Tạo Hội đồng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CouncilRow({
  council,
  memberCount,
  onSelect,
  isSelected,
  index,
}: {
  council: CouncilWithPopulated
  memberCount: number
  onSelect: () => void
  isSelected: boolean
  index: number
}) {
  const proposal = council.proposalId as { _id: string; titleVI?: string } | string
  const proposalTitle =
    typeof proposal === 'object' ? (proposal.titleVI ?? '—') : proposal

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`border-b transition-colors cursor-pointer hover:bg-muted/40 ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''}`}
      onClick={onSelect}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
            <Gavel className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[260px]">{proposalTitle}</p>
            {council.establishmentDecisionNo && (
              <p className="text-xs text-muted-foreground">{council.establishmentDecisionNo}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
        {COUNCIL_TYPE_LABELS[council.councilType] ?? council.councilType}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={council.status} />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {memberCount}
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
        {council.meetingDeadline ? formatDate(council.meetingDeadline) : '—'}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-center">
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${isSelected ? 'rotate-90 text-indigo-600' : 'text-muted-foreground'}`}
          />
        </div>
      </td>
    </motion.tr>
  )
}

export function CouncilsPage() {
  const { isAdmin, isStaff, isReviewCommittee } = useAuthStore()
  const isAdminOrStaff = isAdmin() || isStaff()
  const [selectedCouncil, setSelectedCouncil] = useState<CouncilWithPopulated | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const councilsQuery = useQuery({
    queryKey: ['councils', 'my-memberships'],
    queryFn: () => councilsApi.myMemberships().then((r) => r.data.data),
    staleTime: 60_000,
  })

  const memberships = (councilsQuery.data ?? []) as CouncilMemberWithUser[]

  // Deduplicate councils extracted from membership records
  const councils = memberships
    .map((m) => {
      const c = m.councilId as unknown as CouncilWithPopulated
      return typeof c === 'object' && c !== null ? c : null
    })
    .filter((c): c is CouncilWithPopulated => c !== null)
    .filter((c, i, arr) => arr.findIndex((x) => x._id === c._id) === i)

  const memberCountMap = memberships.reduce<Record<string, number>>((acc, m) => {
    const id = typeof m.councilId === 'string' ? m.councilId : (m.councilId as CouncilWithPopulated)?._id
    if (id) acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  const handleSelectCouncil = (council: CouncilWithPopulated) => {
    setSelectedCouncil((prev) => (prev?._id === council._id ? null : council))
  }

  const isLoading = councilsQuery.isLoading

  const statusChips = [
    { label: 'Tất cả', count: councils.length, color: 'bg-gray-100 text-gray-700' },
    {
      label: 'Đang hoạt động',
      count: councils.filter((c) => c.status === 'ACTIVE').length,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Đang thành lập',
      count: councils.filter((c) => c.status === 'FORMING').length,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Hoàn thành',
      count: councils.filter((c) => c.status === 'COMPLETED').length,
      color: 'bg-teal-100 text-teal-700',
    },
  ]

  return (
    <div className="space-y-6 relative">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Hội đồng Xét duyệt"
          description={
            isAdminOrStaff
              ? 'Quản lý tất cả hội đồng xét duyệt đề xuất nghiên cứu'
              : 'Danh sách hội đồng bạn tham gia với tư cách thành viên'
          }
          actions={
            isAdminOrStaff ? (
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo Hội đồng
              </Button>
            ) : undefined
          }
        />
      </motion.div>

      {/* Summary chips */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2.5 flex-wrap"
        >
          {statusChips.map((chip) => (
            <div
              key={chip.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${chip.color}`}
            >
              {chip.label}
              <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-xs leading-none">
                {chip.count}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`transition-all duration-300 ${selectedCouncil ? 'mr-[420px]' : ''}`}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="py-3.5 px-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              {isReviewCommittee() && !isAdminOrStaff ? 'Hội đồng của tôi' : 'Danh sách Hội đồng'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : councils.length === 0 ? (
              <EmptyState
                title="Chưa có hội đồng"
                description={
                  isAdminOrStaff
                    ? 'Hãy tạo hội đồng đầu tiên để bắt đầu quá trình xét duyệt.'
                    : 'Bạn chưa là thành viên của hội đồng nào.'
                }
                icon={<Shield className="h-8 w-8 text-muted-foreground" />}
                action={
                  isAdminOrStaff ? (
                    <Button onClick={() => setShowCreate(true)} className="gap-2" size="sm">
                      <Plus className="h-4 w-4" />
                      Tạo Hội đồng
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/10">
                      {['Đề xuất', 'Loại hội đồng', 'Trạng thái', 'Thành viên', 'Hạn họp', ''].map(
                        (th) => (
                          <th
                            key={th}
                            className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                          >
                            {th}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {councils.map((council, i) => (
                      <CouncilRow
                        key={council._id}
                        council={council}
                        memberCount={memberCountMap[council._id] ?? 0}
                        onSelect={() => handleSelectCouncil(council)}
                        isSelected={selectedCouncil?._id === council._id}
                        index={i}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedCouncil && (
          <CouncilDetailPanel
            council={selectedCouncil}
            onClose={() => setSelectedCouncil(null)}
            canManage={isAdminOrStaff}
          />
        )}
      </AnimatePresence>

      {/* Create dialog */}
      <CreateCouncilDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
