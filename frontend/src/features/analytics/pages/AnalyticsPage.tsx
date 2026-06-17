import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { FileText, CheckCircle2, DollarSign, Briefcase, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { analyticsApi } from '@/api/analytics.api'
import { formatCurrency, formatNumber } from '@/lib/utils'

const COLORS = ['#E8501A', '#003F87', '#22c55e', '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e']

const MONTHLY_DATA = [
  { month: 'T1', proposals: 8, approved: 5 },
  { month: 'T2', proposals: 12, approved: 8 },
  { month: 'T3', proposals: 15, approved: 10 },
  { month: 'T4', proposals: 10, approved: 7 },
  { month: 'T5', proposals: 18, approved: 12 },
  { month: 'T6', proposals: 22, approved: 14 },
  { month: 'T7', proposals: 16, approved: 11 },
  { month: 'T8', proposals: 20, approved: 13 },
  { month: 'T9', proposals: 25, approved: 18 },
  { month: 'T10', proposals: 19, approved: 14 },
  { month: 'T11', proposals: 28, approved: 20 },
  { month: 'T12', proposals: 32, approved: 24 },
]

const DEPARTMENT_DATA = [
  { name: 'Công nghệ thông tin', funding: 2_500_000_000 },
  { name: 'Quản trị kinh doanh', funding: 1_800_000_000 },
  { name: 'Kỹ thuật', funding: 2_200_000_000 },
  { name: 'Ngôn ngữ', funding: 900_000_000 },
  { name: 'Thiết kế', funding: 1_100_000_000 },
]

const STATUS_PIE_DATA = [
  { name: 'Đã duyệt', value: 45 },
  { name: 'Đang xét', value: 18 },
  { name: 'Từ chối', value: 12 },
  { name: 'Bản nháp', value: 20 },
  { name: 'Đã ký HĐ', value: 30 },
  { name: 'Hoàn thành', value: 25 },
]

interface OverviewData {
  totalProposals: number
  approvedProposals: number
  totalFunding: number
  activeContracts: number
}

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />
}

export function AnalyticsPage() {
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then((r) => r.data.data as unknown as OverviewData),
  })

  const overview: OverviewData = rawData ?? {
    totalProposals: 150,
    approvedProposals: 45,
    totalFunding: 8_500_000_000,
    activeContracts: 30,
  }

  const stats = [
    {
      label: 'Tổng đề xuất',
      value: formatNumber(overview.totalProposals),
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      trend: '+12% so với kỳ trước',
      trendUp: true,
    },
    {
      label: 'Đề xuất được duyệt',
      value: formatNumber(overview.approvedProposals),
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      trend: `Tỷ lệ: ${overview.totalProposals > 0 ? Math.round((overview.approvedProposals / overview.totalProposals) * 100) : 0}%`,
      trendUp: true,
    },
    {
      label: 'Tổng kinh phí phê duyệt',
      value: formatCurrency(overview.totalFunding),
      icon: DollarSign,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      trend: '+8% so với năm ngoái',
      trendUp: true,
    },
    {
      label: 'Hợp đồng đang hiệu lực',
      value: formatNumber(overview.activeContracts),
      icon: Briefcase,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      trend: '3 sắp hết hạn',
      trendUp: false,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân tích & Báo cáo"
        description="Tổng quan thống kê hệ thống quản lý nghiên cứu khoa học"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <TrendingUp className={`h-4 w-4 ${stat.trendUp ? 'text-green-500' : 'text-orange-500'}`} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                    <p className={`text-xs mt-1.5 font-medium ${stat.trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                      {stat.trend}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly trend */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Xu hướng đề xuất theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={260} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="proposals" fill="#003F87" name="Tổng đề xuất" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" fill="#22c55e" name="Được duyệt" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Phân bổ trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={260} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={STATUS_PIE_DATA}
                      cx="50%"
                      cy="42%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {STATUS_PIE_DATA.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatNumber(Number(value ?? 0)), 'Đề xuất']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department funding + Line chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kinh phí theo Khoa/Bộ môn</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={DEPARTMENT_DATA}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={75}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), 'Kinh phí']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="funding" fill="#E8501A" radius={[0, 4, 4, 0]} name="Kinh phí" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tỷ lệ phê duyệt theo tháng (%)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={MONTHLY_DATA.map((d) => ({
                      ...d,
                      rate: d.proposals > 0 ? Math.round((d.approved / d.proposals) * 100) : 0,
                    }))}
                    margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(v) => [`${Number(v)}%`, 'Tỷ lệ duyệt']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8b5cf6' }}
                      activeDot={{ r: 6 }}
                      name="Tỷ lệ"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
