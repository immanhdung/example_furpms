import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'system',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setTheme: (theme) => {
        set({ theme })
        const root = document.documentElement
        if (theme === 'dark') root.classList.add('dark')
        else if (theme === 'light') root.classList.remove('dark')
        else {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark')
          else root.classList.remove('dark')
        }
      },
    }),
    { name: 'furpms-ui' },
  ),
)
