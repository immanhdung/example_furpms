import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellOff,
  CheckCheck,
  FileText,
  Award,
  Briefcase,
  DollarSign,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { notificationsApi } from '@/api/notifications.api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

type TabValue = 'all' | 'unread'

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  PROPOSAL: FileText,
  COUNCIL: Award,
  CONTRACT: Briefcase,
  DISBURSEMENT: DollarSign,
  ALERT: AlertCircle,
}

const TYPE_COLOR_MAP: Record<string, string> = {
  PROPOSAL: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40',
  COUNCIL: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40',
  CONTRACT: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40',
  DISBURSEMENT: 'bg-green-100 text-green-600 dark:bg-green-950/40',
  ALERT: 'bg-red-100 text-red-600 dark:bg-red-950/40',
}

function getIconConfig(type: string) {
  const Icon = TYPE_ICON_MAP[type] ?? Info
  const color = TYPE_COLOR_MAP[type] ?? 'bg-gray-100 text-gray-600'
  return { Icon, color }
}

function NotificationSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-2 w-2 rounded-full mt-2" />
        </div>
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkRead,
  index,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  index: number
}) {
  const { Icon, color } = getIconConfig(notification.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => !notification.isRead && onMarkRead(notification._id)}
      className={cn(
        'flex items-start gap-4 px-5 py-4 border-b transition-colors group',
        notification.isRead
          ? 'hover:bg-muted/30 cursor-default'
          : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 cursor-pointer bg-blue-50/30 dark:bg-blue-950/10',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.isRead ? 'font-normal text-foreground/80' : 'font-semibold text-foreground',
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1.5">
          {formatDate(notification.createdAt, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Unread dot */}
      <div className="flex-shrink-0 pt-1.5">
        {!notification.isRead ? (
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 block" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-transparent block" />
        )}
      </div>
    </motion.div>
  )
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabValue>('all')
  const [page, setPage] = useState(1)
  const limit = 15

  const params: Record<string, unknown> = {
    page,
    limit,
    ...(tab === 'unread' ? { isRead: false } : {}),
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', tab, page],
    queryFn: () => notificationsApi.list(params).then((r) => r.data.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data.data),
    staleTime: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const notifications = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const unreadCount = unreadCountData?.count ?? 0

  const handleTabChange = (v: string) => {
    setTab(v as TabValue)
    setPage(1)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Thông báo"
          description="Theo dõi tất cả thông báo và cập nhật trong hệ thống"
          actions={
            unreadCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
                {markAllReadMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
              </Button>
            ) : undefined
          }
        />
      </motion.div>

      {/* Tabs + unread badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5">
              Chưa đọc
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] rounded-full bg-indigo-600 text-white text-[10px] font-bold px-1 leading-none py-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {data && (
          <p className="text-xs text-muted-foreground">
            {data.total} thông báo
          </p>
        )}
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <NotificationSkeleton />
            ) : isError ? (
              <EmptyState
                title="Không thể tải thông báo"
                description="Đã xảy ra lỗi. Vui lòng thử lại sau."
                icon={<AlertCircle className="h-8 w-8 text-destructive" />}
              />
            ) : notifications.length === 0 ? (
              <EmptyState
                title={tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
                description={
                  tab === 'unread'
                    ? 'Bạn đã đọc tất cả thông báo. Tốt lắm!'
                    : 'Các thông báo mới sẽ xuất hiện ở đây.'
                }
                icon={
                  tab === 'unread' ? (
                    <CheckCheck className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                  )
                }
              />
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((notification, i) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkRead={(id) => markReadMutation.mutate(id)}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                    page === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-muted text-muted-foreground',
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 7 && <span className="text-muted-foreground text-sm">...</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="gap-1"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
