import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isStaff: () => boolean
  isFaculty: () => boolean
  isReviewCommittee: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
      isAdmin: () => get().user?.roles.includes('Admin') ?? false,
      isStaff: () => get().user?.roles.includes('Staff') ?? false,
      isFaculty: () => get().user?.roles.includes('Faculty') ?? false,
      isReviewCommittee: () => get().user?.roles.includes('ReviewCommittee') ?? false,
    }),
    { name: 'furpms-auth' },
  ),
)
