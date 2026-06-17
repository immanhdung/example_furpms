import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Award, ClipboardList, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { analyticsApi } from '@/api/analytics.api'
import { formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface OverviewData {
  pendingProposals: number
  upcomingMeetings: number
  contractsNeedingAction: number
  recentSubmissions: number
}

export function StaffDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then((r) => r.data.data as unknown as OverviewData),
  })

  const stats = [
    { label: 'Đề xuất chờ xử lý', value: data?.pendingProposals ?? 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Hội đồng đang hoạt động', value: data?.contractsNeedingAction ?? 0, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Hợp đồng cần xử lý', value: data?.recentSubmissions ?? 0, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: 'Cuộc họp sắp tới', value: data?.upcomingMeetings ?? 0, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  ]

  const quickActions = [
    { label: 'Xem tất cả đề xuất', path: '/proposals', description: 'Xem và duyệt đề xuất nghiên cứu' },
    { label: 'Quản lý hội đồng', path: '/councils', description: 'Thành lập và quản lý hội đồng' },
    { label: 'Hợp đồng', path: '/contracts', description: 'Tạo và quản lý hợp đồng' },
    { label: 'Chu kỳ nghiên cứu', path: '/cycles', description: 'Quản lý chu kỳ nghiên cứu' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Chào mừng, {user?.fullName?.split(' ').pop()} 👋</h1>
        <p className="text-muted-foreground">Hôm nay là {formatDate(new Date())}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Thao tác nhanh</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader><CardTitle className="text-base">Nhiệm vụ hôm nay</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { task: 'Xem xét 3 đề xuất mới nộp', priority: 'Ưu tiên cao', color: 'text-red-600' },
                  { task: 'Chuẩn bị tài liệu cho Hội đồng XB-01', priority: 'Ưu tiên trung bình', color: 'text-yellow-600' },
                  { task: 'Gửi thông báo cho PI về hợp đồng', priority: 'Bình thường', color: 'text-green-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{item.task}</p>
                      <p className={`text-xs ${item.color}`}>{item.priority}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
