import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { AdminDashboard } from './AdminDashboard'
import { StaffDashboard } from './StaffDashboard'
import { FacultyDashboard } from './FacultyDashboard'
import { CommitteeDashboard } from './CommitteeDashboard'

export function DashboardRouter() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.roles.includes('Admin')) return <AdminDashboard />
  if (user.roles.includes('Staff')) return <StaffDashboard />
  if (user.roles.includes('ReviewCommittee')) return <CommitteeDashboard />
  return <FacultyDashboard />
}

