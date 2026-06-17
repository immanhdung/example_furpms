import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users,
  Star,
  CalendarDays,
  CheckSquare,
  ArrowUpRight,
  Clock,
  ClipboardCheck,
  Award,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { councilsApi } from '@/api/councils.api'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import type { CouncilMember } from '@/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const MEMBER_ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  CHAIR: {
    label: 'Chu tich',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  SECRETARY: {
    label: 'Thu ky',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  MEMBER: {
    label: 'Thanh vien',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
}

const mockPendingScores = [
  {
    id: 'S-001',
    proposalTitle: 'Ung dung Deep Learning trong nhan dang hinh anh y te',
    councilName: 'HD Xet duyet KHCN-2024-Q1',
    deadline: '2024-01-20',
    criteriaCount: 5,
    urgent: true,
  },
  {
    id: 'S-002',
    proposalTitle: 'Phat trien nen tang hoc tap thich nghi dua tren AI',
    councilName: 'HD Xet duyet CNTT-2024-Q1',
    deadline: '2024-01-22',
    criteriaCount: 5,
    urgent: false,
  },
  {
    id: 'S-003',
    proposalTitle: 'Nghien cuu mo hinh kinh te tuan hoan trong san xuat',
    councilName: 'HD Nghiem thu KT-2024-001',
    deadline: '2024-01-25',
    criteriaCount: 6,
    urgent: false,
  },
]

const mockUpcomingMeetings = [
  {
    id: 'M-001',
    title: 'Hop xet duyet de xuat chu ky 2024-Q1',
    councilName: 'HD Xet duyet KHCN-2024-Q1',
    date: '2024-01-20',
    time: '09:00',
    location: 'Phong hop A3.01',
    role: 'MEMBER',
  },
  {
    id: 'M-002',
    title: 'Nghiem thu cap co so de tai CS-2023-011',
    councilName: 'HD Nghiem thu KT-2024-001',
    date: '2024-01-23',
    time: '14:30',
    location: 'Phong hop B2.03',
    role: 'CHAIR',
  },
]

const mockRecentDecisions = [
  {
    id: 'D-001',
    proposalTitle: 'Phan tich du lieu lon trong chuoi cung ung toan cau',
    council: 'HD Xet duyet CNTT-2023-Q4',
    decision: 'APPROVED',
    decisionDate: '2024-01-10',
    score: 88,
  },
  {
    id: 'D-002',
    proposalTitle: 'Thiet ke he thong IoT giam sat moi truong do thi',
    council: 'HD Xet duyet KHCN-2023-Q4',
    decision: 'REVISION_REQUIRED',
    decisionDate: '2024-01-08',
    score: 72,
  },
  {
    id: 'D-003',
    proposalTitle: 'Mo hinh du doan xu huong thi truong tai chinh',
    council: 'HD Xet duyet KT-2023-Q4',
    decision: 'REJECTED',
    decisionDate: '2024-01-05',
    score: 58,
  },
]

const decisionConfig: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Phe duyet', className: 'bg-green-100 text-green-700 border-green-200' },
  REVISION_REQUIRED: {
    label: 'Can chinh sua',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  REJECTED: { label: 'Tu choi', className: 'bg-red-100 text-red-700 border-red-200' },
}

function MembershipSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full ml-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CommitteeDashboard() {
  const { user } = useAuthStore()

  const { data: memberships, isLoading: membershipsLoading } = useQuery<CouncilMember[]>({
    queryKey: ['my-council-memberships'],
    queryFn: () => councilsApi.myMemberships().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const summaryStats = [
    {
      label: 'Hoi dong tham gia',
      value: memberships?.length ?? 0,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Cho cham diem',
      value: mockPendingScores.length,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Cuoc hop sap toi',
      value: mockUpcomingMeetings.length,
      icon: CalendarDays,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: 'Quyet dinh thang nay',
      value: mockRecentDecisions.length,
      icon: CheckSquare,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
  ]

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chao buoi sang'
    if (hour < 18) return 'Chao buoi chieu'
    return 'Chao buoi toi'
  }

  return (
    <motion.div
      className="space-y-6 p-6 min-h-screen bg-gray-50/50 dark:bg-gray-950/20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {greeting()}, {user?.fullName?.split(' ').pop() ?? 'Thanh vien'}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Bang dieu hanh Hoi dong
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quan ly cac hoi dong, cham diem va quyet dinh xet duyet
          </p>
        </div>
        {mockPendingScores.filter((s) => s.urgent).length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              {mockPendingScores.filter((s) => s.urgent).length} bai cham diem can hoan thanh gap
            </span>
          </div>
        )}
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-900">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-0.5">
                        {membershipsLoading ? (
                          <Skeleton className="h-7 w-8 mt-1" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Council Memberships */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  Hoi dong cua toi
                </CardTitle>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Xem tat ca
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {membershipsLoading ? (
                <MembershipSkeleton />
              ) : !memberships || memberships.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Chua tham gia hoi dong nao</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memberships.slice(0, 5).map((membership, i) => {
                    const roleConfig =
                      MEMBER_ROLE_CONFIG[membership.memberRole] ?? MEMBER_ROLE_CONFIG['MEMBER']
                    return (
                      <motion.div
                        key={membership._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.07 }}
                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                            {membership.councilId}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleConfig.className}`}
                            >
                              {roleConfig.label}
                            </span>
                            {membership.isExternal && (
                              <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-100 text-orange-700 border-orange-200 font-medium">
                                Ngoai truong
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Scores */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    Cho cham diem
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cac de xuat can ban hoan thanh bang diem
                  </p>
                </div>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Xem tat ca
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {mockPendingScores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <ClipboardCheck className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Khong co bang diem nao cho xu ly
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ban da hoan thanh tat ca cac bang cham diem
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {mockPendingScores.map((score, i) => (
                    <motion.div
                      key={score.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.07 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          score.urgent
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}
                      >
                        <Star
                          className={`h-5 w-5 ${score.urgent ? 'text-red-600' : 'text-amber-600'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {score.proposalTitle}
                          </p>
                          {score.urgent && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium shrink-0">
                              Khan
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">
                            {score.councilName}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            <span>Han: {formatDate(score.deadline)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {score.criteriaCount} tieu chi
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Upcoming Meetings */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  Lich hop cua toi
                </CardTitle>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Xem lich
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {mockUpcomingMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <CalendarDays className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Khong co lich hop sap toi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mockUpcomingMeetings.map((meeting, i) => {
                    const roleConfig =
                      MEMBER_ROLE_CONFIG[meeting.role] ?? MEMBER_ROLE_CONFIG['MEMBER']
                    return (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                                {meeting.title}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${roleConfig.className}`}
                              >
                                {roleConfig.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {meeting.councilName}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>
                                  {formatDate(meeting.date)} luc {meeting.time}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground truncate">
                                {meeting.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Decisions */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  Quyet dinh gan day
                </CardTitle>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Lich su
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {mockRecentDecisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Chua co quyet dinh nao</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {mockRecentDecisions.map((decision, i) => {
                    const config =
                      decisionConfig[decision.decision] ?? decisionConfig['REJECTED']
                    return (
                      <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {decision.proposalTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(decision.decisionDate)}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {decision.score}/100
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border font-medium ${config.className}`}
                          >
                            {config.label}
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
