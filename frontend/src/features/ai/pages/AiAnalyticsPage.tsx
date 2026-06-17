import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  Database,
  RefreshCw,
  DollarSign,
  BarChart2,
  CheckCircle,
} from 'lucide-react'
import { aiApi } from '@/api/ai.api'
import type { AiLogEntry } from '@/api/ai.api'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'

const FEATURE_LABELS: Record<string, string> = {
  PROPOSAL_SUMMARY: 'Tóm tắt ĐX',
  FINAL_REPORT_SUMMARY: 'Tóm tắt BC',
  REVIEWER_SUGGESTION: 'Gợi ý PB',
  RECOMMENDATION: 'Khuyến nghị',
  SEMANTIC_SEARCH: 'Tìm kiếm',
}

const FEATURE_COLORS: Record<string, string> = {
  PROPOSAL_SUMMARY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  FINAL_REPORT_SUMMARY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  REVIEWER_SUGGESTION: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  RECOMMENDATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  SEMANTIC_SEARCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AiAnalyticsPage() {
  const [days, setDays] = useState(30)

  const { data: analyticsData, isLoading: analyticsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-analytics-detail', days],
    queryFn: () => aiApi.getAnalytics(days),
    staleTime: 60_000,
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: () => aiApi.getLogs({ limit: 20 }),
    staleTime: 30_000,
  })

  const { data: cacheData } = useQuery({
    queryKey: ['ai-cache-stats'],
    queryFn: () => aiApi.getCacheStats(),
    staleTime: 60_000,
  })

  const analytics = analyticsData?.data?.data
  const logs = (logsData?.data?.data as { items?: AiLogEntry[] })?.items ?? []
  const cache = cacheData?.data?.data

  const COST_PER_1M = 0.1
  const estimatedCost = (((analytics?.tokenStats?.totalTokens ?? 0) / 1_000_000) * COST_PER_1M).toFixed(4)

  const kpiStats = [
    {
      label: 'Tổng yêu cầu',
      value: formatNumber(analytics?.totalRequests ?? 0),
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Tokens sử dụng',
      value: formatNumber(analytics?.tokenStats?.totalTokens ?? 0),
      icon: Sparkles,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Cache hits',
      value: formatNumber(analytics?.cacheStats?.cached ?? 0),
      icon: Zap,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Thời gian TB',
      value: `${Math.round(analytics?.tokenStats?.avgDurationMs ?? 0)}ms`,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: 'Số lỗi',
      value: formatNumber(
        (analytics?.byFeature ?? []).reduce((sum, f) => sum + (f.errors ?? 0), 0),
      ),
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: 'Chi phí ước tính',
      value: `$${estimatedCost}`,
      icon: DollarSign,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    },
  ]

  const totalRequests = analytics?.totalRequests ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân tích AI"
        description="Báo cáo chi tiết sử dụng và hiệu suất tính năng AI"
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
                  {d} ngày
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {analyticsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))
          : kpiStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className={`rounded-lg p-2 w-fit mb-2 ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Feature breakdown */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Phân bổ theo tính năng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-4 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (analytics?.byFeature ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-4">
                  {(analytics?.byFeature ?? []).map((f) => {
                    const pct = Math.round((f.count / totalRequests) * 100)
                    return (
                      <div key={f._id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{FEATURE_LABELS[f._id] ?? f._id}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatNumber(f.count)} yêu cầu</span>
                            <span className="font-medium text-foreground">{pct}%</span>
                          </div>
                        </div>
                        <div className="bg-muted rounded-full h-2">
                          <motion.div
                            className="h-2 rounded-full"
                            style={{ backgroundColor: Object.values({
                              PROPOSAL_SUMMARY: '#003F87',
                              FINAL_REPORT_SUMMARY: '#E8501A',
                              REVIEWER_SUGGESTION: '#22c55e',
                              RECOMMENDATION: '#f59e0b',
                              SEMANTIC_SEARCH: '#8b5cf6',
                            })[Object.keys({
                              PROPOSAL_SUMMARY: '#003F87',
                              FINAL_REPORT_SUMMARY: '#E8501A',
                              REVIEWER_SUGGESTION: '#22c55e',
                              RECOMMENDATION: '#f59e0b',
                              SEMANTIC_SEARCH: '#8b5cf6',
                            }).indexOf(f._id)] ?? '#94a3b8' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cache stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Trạng thái Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">
                  {Math.round((analytics?.cacheStats?.hitRate ?? 0) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Cache Hit Rate</p>
                <div className="mt-3 bg-muted rounded-full h-3 mx-auto max-w-[140px]">
                  <motion.div
                    className="h-3 rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analytics?.cacheStats?.hitRate ?? 0) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng entries</span>
                  <span className="font-medium">{formatNumber(cache?.total ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đang hoạt động</span>
                  <span className="font-medium text-green-600">{formatNumber(cache?.active ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã hết hạn</span>
                  <span className="font-medium text-muted-foreground">{formatNumber(cache?.expired ?? 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Cache hits</span>
                  <span className="font-medium text-primary">{formatNumber(analytics?.cacheStats?.cached ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent AI logs table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Lịch sử yêu cầu AI gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có lịch sử</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-medium">Tính năng</th>
                      <th className="pb-2 font-medium">Model</th>
                      <th className="pb-2 font-medium text-right">Tokens</th>
                      <th className="pb-2 font-medium text-right">Thời gian</th>
                      <th className="pb-2 font-medium text-center">Cache</th>
                      <th className="pb-2 font-medium text-right">Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log._id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2.5">
                          <Badge
                            className={`text-xs ${FEATURE_COLORS[log.feature] ?? 'bg-gray-100 text-gray-800'}`}
                            variant="secondary"
                          >
                            {FEATURE_LABELS[log.feature] ?? log.feature}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground font-mono">
                          {log.model.replace('gemini-', 'g-').slice(0, 15)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {formatNumber(log.tokensTotal)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {log.durationMs > 0 ? `${log.durationMs}ms` : '—'}
                        </td>
                        <td className="py-2.5 text-center">
                          {log.cached ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
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
