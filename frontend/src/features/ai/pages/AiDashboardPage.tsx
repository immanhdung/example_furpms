import { useState } from 'react'
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
import {
  Sparkles,
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { aiApi } from '@/api/ai.api'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'

const FEATURE_LABELS: Record<string, string> = {
  PROPOSAL_SUMMARY: 'Tóm tắt ĐX',
  FINAL_REPORT_SUMMARY: 'Tóm tắt BC',
  REVIEWER_SUGGESTION: 'Gợi ý PB',
  RECOMMENDATION: 'Khuyến nghị',
  SEMANTIC_SEARCH: 'Tìm kiếm',
}

const FEATURE_COLORS: Record<string, string> = {
  PROPOSAL_SUMMARY: '#003F87',
  FINAL_REPORT_SUMMARY: '#E8501A',
  REVIEWER_SUGGESTION: '#22c55e',
  RECOMMENDATION: '#f59e0b',
  SEMANTIC_SEARCH: '#8b5cf6',
}

const PIE_COLORS = ['#003F87', '#E8501A', '#22c55e', '#f59e0b', '#8b5cf6']

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = 250 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />
}

export function AiDashboardPage() {
  const [days, setDays] = useState(30)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-analytics', days],
    queryFn: () => aiApi.getAnalytics(days),
    staleTime: 60_000,
  })

  const analytics = data?.data?.data

  const stats = [
    {
      label: 'Tổng yêu cầu AI',
      value: formatNumber(analytics?.totalRequests ?? 0),
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      sub: `trong ${days} ngày qua`,
    },
    {
      label: 'Tổng Token sử dụng',
      value: formatNumber(analytics?.tokenStats?.totalTokens ?? 0),
      icon: Sparkles,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      sub: `TB ${formatNumber(Math.round(analytics?.tokenStats?.avgTokens ?? 0))} / yêu cầu`,
    },
    {
      label: 'Tỷ lệ Cache Hit',
      value: `${Math.round((analytics?.cacheStats?.hitRate ?? 0) * 100)}%`,
      icon: Zap,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      sub: `${formatNumber(analytics?.cacheStats?.cached ?? 0)} từ cache`,
    },
    {
      label: 'Thời gian phản hồi TB',
      value: `${Math.round(analytics?.tokenStats?.avgDurationMs ?? 0)}ms`,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      sub: `Max: ${Math.round(analytics?.tokenStats?.maxDurationMs ?? 0)}ms`,
    },
  ]

  const pieData = (analytics?.byFeature ?? []).map((f) => ({
    name: FEATURE_LABELS[f._id] ?? f._id,
    value: f.count,
    fill: FEATURE_COLORS[f._id] ?? '#94a3b8',
  }))

  const featureTableData = (analytics?.byFeature ?? []).map((f) => ({
    ...f,
    label: FEATURE_LABELS[f._id] ?? f._id,
    color: FEATURE_COLORS[f._id] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Dashboard"
        description="Thống kê sử dụng tính năng AI — Google Gemini 2.5 Flash"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    days === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Daily requests bar chart */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Yêu cầu AI theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={250} />
              ) : (analytics?.byDay ?? []).length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Database className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có dữ liệu</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.byDay ?? []} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: string) => v.slice(5)}
                    />
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
                    <Bar dataKey="requests" fill="#003F87" name="Tổng yêu cầu" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cached" fill="#22c55e" name="Cache hits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature distribution pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Phân bổ theo tính năng</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton height={250} />
              ) : pieData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có dữ liệu</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="42%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatNumber(Number(value)), 'Yêu cầu']}
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

      {/* Token usage line chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Token sử dụng theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton height={200} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={analytics?.byDay ?? []}
                  margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(v) => [formatNumber(Number(v)), 'Tokens']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="#E8501A"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#E8501A' }}
                    activeDot={{ r: 5 }}
                    name="Tokens"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature performance table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hiệu suất theo tính năng</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : featureTableData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Tính năng</th>
                      <th className="pb-2 font-medium text-right">Yêu cầu</th>
                      <th className="pb-2 font-medium text-right">TB thời gian</th>
                      <th className="pb-2 font-medium text-right">Tổng tokens</th>
                      <th className="pb-2 font-medium text-right">Lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureTableData.map((f) => (
                      <tr key={f._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: f.color }}
                          >
                            {f.label}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium">{formatNumber(f.count)}</td>
                        <td className="py-3 text-right text-muted-foreground">{Math.round(f.avgDuration)}ms</td>
                        <td className="py-3 text-right text-muted-foreground">{formatNumber(f.tokens)}</td>
                        <td className="py-3 text-right">
                          {f.errors > 0 ? (
                            <span className="text-red-600 font-medium">{f.errors}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
