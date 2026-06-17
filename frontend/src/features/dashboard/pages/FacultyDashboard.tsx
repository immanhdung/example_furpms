import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Briefcase, PackageCheck, Bell, Plus } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { proposalsApi } from '@/api/proposals.api'
import { contractsApi } from '@/api/contracts.api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export function FacultyDashboard() {
  const navigate = useNavigate()

  const { data: proposalsData, isLoading: loadingProposals } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: () => proposalsApi.myProposals({ limit: 5 }).then((r) => r.data.data),
  })

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: () => contractsApi.list({ limit: 5 }).then((r) => r.data.data),
  })

  const proposals = proposalsData?.items ?? []
  const contracts = contractsData?.items ?? []

  const statusCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const stats = [
    { label: 'Tổng đề xuất', value: proposalsData?.total ?? 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Hợp đồng hiệu lực', value: contracts.filter((c) => c.status === 'ACTIVE').length, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Sản phẩm đến hạn', value: 0, icon: PackageCheck, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: 'Thông báo chưa đọc', value: 0, icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Không gian làm việc của tôi</h1>
          <p className="text-muted-foreground mt-1">Quản lý đề xuất và hợp đồng nghiên cứu</p>
        </div>
        <Button onClick={() => navigate('/proposals/create')}>
          <Plus className="h-4 w-4" />
          Tạo đề xuất mới
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                {loadingProposals ? (
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Proposals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Đề xuất gần đây</CardTitle>
                <button className="text-xs text-primary hover:underline" onClick={() => navigate('/proposals/my')}>Xem tất cả</button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProposals ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có đề xuất nào</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/proposals/create')}>
                    Tạo đề xuất đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {proposals.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => navigate(`/proposals/${p._id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{p.titleVI}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.createdAt)}</p>
                      </div>
                      <StatusBadge status={p.status} className="ml-2 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Proposal Status Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3"><CardTitle className="text-base">Phân bố trạng thái</CardTitle></CardHeader>
            <CardContent>
              {loadingProposals ? (
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-36 w-36 rounded-full" />
                  <div className="space-y-2 w-full">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
                </div>
              ) : pieData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Chưa có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Đề xuất']} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Contracts */}
      {contracts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Hợp đồng đang thực hiện</CardTitle>
                <button className="text-xs text-primary hover:underline" onClick={() => navigate('/contracts')}>Xem tất cả</button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingContracts ? (
                <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="space-y-2">
                  {contracts.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => navigate(`/contracts/${c._id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-sm">{c.contractNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(c.startDate)} - {formatDate(c.endDate)} · {formatCurrency(c.totalAmount)}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
