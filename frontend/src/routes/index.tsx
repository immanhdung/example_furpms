import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

// Auth
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'

// Dashboard
import { DashboardRouter } from '@/features/dashboard/pages/DashboardRouter'

// Lazy load all feature pages
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage })))
const CyclesPage = lazy(() => import('@/features/cycles/pages/CyclesPage').then((m) => ({ default: m.CyclesPage })))
const ProposalsPage = lazy(() => import('@/features/proposals/pages/ProposalsPage').then((m) => ({ default: m.ProposalsPage })))
const MyProposalsPage = lazy(() => import('@/features/proposals/pages/MyProposalsPage').then((m) => ({ default: m.MyProposalsPage })))
const CreateProposalPage = lazy(() => import('@/features/proposals/pages/CreateProposalPage').then((m) => ({ default: m.CreateProposalPage })))
const ProposalDetailPage = lazy(() => import('@/features/proposals/pages/ProposalDetailPage').then((m) => ({ default: m.ProposalDetailPage })))
const CouncilsPage = lazy(() => import('@/features/councils/pages/CouncilsPage').then((m) => ({ default: m.CouncilsPage })))
const ContractsPage = lazy(() => import('@/features/contracts/pages/ContractsPage').then((m) => ({ default: m.ContractsPage })))
const ContractDetailPage = lazy(() => import('@/features/contracts/pages/ContractDetailPage').then((m) => ({ default: m.ContractDetailPage })))
const DisbursementsPage = lazy(() => import('@/features/disbursements/pages/DisbursementsPage').then((m) => ({ default: m.DisbursementsPage })))
const DeliverablesPage = lazy(() => import('@/features/deliverables/pages/DeliverablesPage').then((m) => ({ default: m.DeliverablesPage })))
const ProgressReportsPage = lazy(() => import('@/features/reports/pages/ProgressReportsPage').then((m) => ({ default: m.ProgressReportsPage })))
const FinalReportsPage = lazy(() => import('@/features/reports/pages/FinalReportsPage').then((m) => ({ default: m.FinalReportsPage })))
const SettlementsPage = lazy(() => import('@/features/settlements/pages/SettlementsPage').then((m) => ({ default: m.SettlementsPage })))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const AiPage = lazy(() => import('@/features/ai/pages/AiPage').then((m) => ({ default: m.AiPage })))
const AiDashboardPage = lazy(() => import('@/features/ai/pages/AiDashboardPage').then((m) => ({ default: m.AiDashboardPage })))
const AiAnalyticsPage = lazy(() => import('@/features/ai/pages/AiAnalyticsPage').then((m) => ({ default: m.AiAnalyticsPage })))

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
)

const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
    <div className="rounded-full bg-destructive/10 p-6">
      <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold">Không có quyền truy cập</h2>
    <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <DashboardRouter /> },
      {
        path: 'users',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><UsersPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cycles',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><CyclesPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'proposals',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><ProposalsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      { path: 'proposals/my', element: <SuspenseWrapper><MyProposalsPage /></SuspenseWrapper> },
      { path: 'proposals/create', element: <SuspenseWrapper><CreateProposalPage /></SuspenseWrapper> },
      { path: 'proposals/:id', element: <SuspenseWrapper><ProposalDetailPage /></SuspenseWrapper> },
      { path: 'councils', element: <SuspenseWrapper><CouncilsPage /></SuspenseWrapper> },
      { path: 'contracts', element: <SuspenseWrapper><ContractsPage /></SuspenseWrapper> },
      { path: 'contracts/:id', element: <SuspenseWrapper><ContractDetailPage /></SuspenseWrapper> },
      {
        path: 'disbursements',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><DisbursementsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      { path: 'deliverables', element: <SuspenseWrapper><DeliverablesPage /></SuspenseWrapper> },
      { path: 'progress-reports', element: <SuspenseWrapper><ProgressReportsPage /></SuspenseWrapper> },
      { path: 'final-reports', element: <SuspenseWrapper><FinalReportsPage /></SuspenseWrapper> },
      {
        path: 'settlements',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><SettlementsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      { path: 'notifications', element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper> },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><AnalyticsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      { path: 'ai', element: <SuspenseWrapper><AiPage /></SuspenseWrapper> },
      {
        path: 'ai/dashboard',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><AiDashboardPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: 'ai/analytics',
        element: (
          <ProtectedRoute roles={['Admin', 'Staff']}>
            <SuspenseWrapper><AiAnalyticsPage /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
