import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Toaster } from '@/components/ui/toast'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 text-white">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">FURPMS</h1>
          <p className="text-xl font-light opacity-80 mb-2">FPT University Research Project</p>
          <p className="text-xl font-light opacity-80">Management System</p>
          <p className="mt-6 text-sm opacity-60 max-w-sm">
            Hệ thống quản lý đề tài nghiên cứu khoa học toàn diện cho Trường Đại học FPT
          </p>
        </motion.div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
