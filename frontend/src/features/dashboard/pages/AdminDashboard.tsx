import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Award, Briefcase, DollarSign, ArrowUpRight, Activity, TrendingUp, Users } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { analyticsApi } from '@/api/analytics.api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

interface OverviewData {
  totalProposals: number
  approved: number
  activeContracts: number
  totalFunding: number
  pendingReview: number
  totalUsers: number
  submittedThisMonth: number
  completedProjects: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const proposalsByStatus = [
  { status: 'Nháp', count: 12 },
  { status: 'Đã nộp', count: 28 },
  { status: 'Đang xét', count: 15 },
  { status: 'Phê duyệt', count: 34 },
  { status: 'Từ chối', count: 8 },
  { status: 'Hoàn thành', count: 21 },
]

const pieData = [
  { name: 'KHCN', value: 40 },
  { name: 'CNTT', value: 30 },
  { name: 'Kinh tế', value: 18 },
  { name: 'Khác', value: 12 },
]

const recentActivity = [
  { id: '1', text: 'Đề xuất "Nghiên cứu AI trong giáo dục" vừa được nộp', time: '5 phút trước', color: 'bg-blue-500', icon: FileText },
  { id: '2', text: 'Hội đồng XB-2024-01 đã phê duyệt 3 đề xuất', time: '1 giờ trước', color: 'bg-green-500', icon: Award },
  { id: '3', text: 'Hợp đồng HĐ-2024-015 đã được ký kết', time: '2 giờ trước', color: 'bg-purple-500', icon: Briefcase },
  { id: '4', text: 'Giải ngân đợt 2 - HĐ-2024-008 đã được xử lý', time: '4 giờ trước', color: 'bg-orange-500', icon: DollarSign },
  { id: '5', text: '3 người dùng mới đăng ký tham gia hệ thống', time: '1 ngày trước', color: 'bg-indigo-500', icon: Users },
]

function StatSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then((r) => r.data.data as unknown as OverviewData),
    staleTime: 5 * 60 * 1000,
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const stats = [
    { label: 'Tổng đề xuất', value: formatNumber(data?.totalProposals ?? 0), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', change: '+12%' },
    { label: 'Đã phê duyệt', value: formatNumber(data?.approved ?? 0), icon: Award, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', change: '+5%' },
    { label: 'Hợp đồng hiệu lực', value: formatNumber(data?.activeContracts ?? 0), icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', change: '+3%' },
    { label: 'Tổng kinh phí', value: formatCurrency(data?.totalFunding ?? 0), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', change: '+18%' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{greeting()}, {user?.fullName?.split(' ').pop() ?? 'Admin'} 👋</p>
            <h1 className="text-3xl font-bold tracking-tight">Tổng quan Hệ thống</h1>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi toàn bộ hoạt động nghiên cứu khoa học tại FPT University</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border shadow-sm">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs font-medium text-green-600">{stat.change}</span>
                            <span className="text-xs text-muted-foreground">vs tháng trước</span>
                          </div>
                        </div>
                        <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Đề xuất theo trạng thái</CardTitle>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Cập nhật hôm nay</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-end gap-2 px-4 pb-4 h-64">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${40 + i * 10}%` }} />)}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={proposalsByStatus} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: '13px' }}
                      formatter={(value) => [formatNumber(Number(value ?? 0)), 'Đề xuất']}
                    />
                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Theo lĩnh vực</CardTitle>
              <p className="text-xs text-muted-foreground">Phân bố theo hướng nghiên cứu</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-40 w-40 rounded-full" />
                  <div className="space-y-2 w-full">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                      {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: '13px' }}
                      formatter={(value) => [formatNumber(Number(value ?? 0)), 'Đề xuất']}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Hoạt động gần đây</CardTitle>
                <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Xem tất cả</button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3" /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((activity, i) => {
                    const Icon = activity.icon
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.06 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className={`h-9 w-9 rounded-full ${activity.color} flex items-center justify-center`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">{activity.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Chỉ số nhanh</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="space-y-5">
                  {[
                    { label: 'Tỷ lệ phê duyệt', value: 68, color: 'bg-green-500' },
                    { label: 'Hợp đồng đúng tiến độ', value: 82, color: 'bg-blue-500' },
                    { label: 'Giải ngân đúng hạn', value: 91, color: 'bg-purple-500' },
                    { label: 'Báo cáo đúng hạn', value: 74, color: 'bg-orange-500' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${item.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Người dùng', value: formatNumber(data?.totalUsers ?? 0), icon: Users, color: 'text-blue-600' },
                        { label: 'Tháng này', value: formatNumber(data?.submittedThisMonth ?? 0), icon: TrendingUp, color: 'text-green-600' },
                      ].map((item, i) => {
                        const Icon = item.icon
                        return (
                          <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 text-center">
                            <Icon className={`h-5 w-5 ${item.color} mb-1`} />
                            <p className="text-lg font-bold">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
