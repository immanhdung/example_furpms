import { Moon, Sun, Bell, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { toast } from '@/components/ui/toast'
import { authApi } from '@/api/auth.api'

export function Header() {
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()
  const { theme, setTheme, toggleSidebar } = useUIStore()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    toast.success('Đã đăng xuất')
    navigate('/login')
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
