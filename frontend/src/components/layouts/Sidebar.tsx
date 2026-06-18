import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Award, Layers, Briefcase, CreditCard,
  Bell, BarChart2, Cpu, Settings, ChevronLeft, Building, BookOpen, ClipboardList,
  Scale, PackageCheck, FlaskConical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'

interface NavItem { label: string; path: string; icon: React.ReactNode; roles?: string[]; exact?: boolean }

const navItems: NavItem[] = [
  { label: 'Tổng quan', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Người dùng', path: '/users', icon: <Users className="h-5 w-5" />, roles: ['Admin', 'Staff'] },
  { label: 'Chu kỳ nghiên cứu', path: '/cycles', icon: <Layers className="h-5 w-5" />, roles: ['Admin', 'Staff'] },
  { label: 'Loại đề tài', path: '/research-types', icon: <FlaskConical className="h-5 w-5" />, roles: ['Staff'] },
  { label: 'Đề xuất của tôi', path: '/proposals/my', icon: <FileText className="h-5 w-5" />, roles: ['Faculty'] },
  { label: 'Tất cả đề xuất', path: '/proposals', icon: <FileText className="h-5 w-5" />, roles: ['Staff'] },
  { label: 'Hội đồng', path: '/councils', icon: <Award className="h-5 w-5" />, roles: ['Staff', 'ReviewCommittee'] },
  { label: 'Hợp đồng', path: '/contracts', icon: <Briefcase className="h-5 w-5" />, roles: ['Staff', 'Faculty'] },
  { label: 'Giải ngân', path: '/disbursements', icon: <CreditCard className="h-5 w-5" />, roles: ['Staff'] },
  { label: 'Sản phẩm', path: '/deliverables', icon: <PackageCheck className="h-5 w-5" />, roles: ['Staff', 'Faculty'] },
  { label: 'Báo cáo tiến độ', path: '/progress-reports', icon: <ClipboardList className="h-5 w-5" />, roles: ['Staff', 'Faculty'] },
  { label: 'Báo cáo tổng kết', path: '/final-reports', icon: <BookOpen className="h-5 w-5" />, roles: ['Staff', 'Faculty'] },
  { label: 'Quyết toán', path: '/settlements', icon: <Scale className="h-5 w-5" />, roles: ['Staff'] },
  { label: 'Thông báo', path: '/notifications', icon: <Bell className="h-5 w-5" /> },
  { label: 'Phân tích', path: '/analytics', icon: <BarChart2 className="h-5 w-5" />, roles: ['Admin', 'Staff'] },
  { label: 'AI & Tìm kiếm', path: '/ai', icon: <Cpu className="h-5 w-5" />, exact: true },
  { label: 'AI Dashboard', path: '/ai/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['Admin', 'Staff'] },
  { label: 'AI Phân tích', path: '/ai/analytics', icon: <BarChart2 className="h-5 w-5" />, roles: ['Admin', 'Staff'] },
  { label: 'Cài đặt', path: '/settings', icon: <Settings className="h-5 w-5" />, roles: ['Admin'] },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.some((role) => user?.roles.includes(role))
  })

  return (
    <motion.aside
      className="relative flex h-screen flex-col border-r bg-card overflow-hidden"
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b flex-shrink-0">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">FURPMS</p>
                <p className="text-xs text-muted-foreground">FPT University</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!sidebarOpen && (
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mx-auto">
            <Building className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn('p-1 rounded-md hover:bg-muted transition-colors flex-shrink-0', !sidebarOpen && 'hidden')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    !sidebarOpen && 'justify-center px-2',
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        className="truncate"
                        initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {sidebarOpen && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.roles[0]}</p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
