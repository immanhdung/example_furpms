import * as React from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

const toastStore: ToastStore = {
  toasts: [],
  add: () => {},
  remove: () => {},
}

const listeners = new Set<() => void>()

function getStore() { return { ...toastStore } }

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastStore.toasts = [...toastStore.toasts, { ...t, id }]
  listeners.forEach((l) => l())
  setTimeout(() => {
    toastStore.toasts = toastStore.toasts.filter((x) => x.id !== id)
    listeners.forEach((l) => l())
  }, t.duration ?? 4000)
}

toast.success = (title: string, description?: string) => toast({ type: 'success', title, description })
toast.error = (title: string, description?: string) => toast({ type: 'error', title, description })
toast.info = (title: string, description?: string) => toast({ type: 'info', title, description })

function useToastStore() {
  const [state, setState] = React.useState(getStore)
  React.useEffect(() => {
    const update = () => setState(getStore())
    listeners.add(update)
    return () => { listeners.delete(update) }
  }, [])
  return state
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
}

const bgMap: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 dark:bg-green-950/30',
  error: 'border-red-200 bg-red-50 dark:bg-red-950/30',
  info: 'border-blue-200 bg-blue-50 dark:bg-blue-950/30',
  warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30',
}

export function Toaster() {
  const { toasts } = useToastStore()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={cn('flex items-start gap-3 rounded-lg border p-4 shadow-lg', bgMap[t.type])}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => { toastStore.toasts = toastStore.toasts.filter((x) => x.id !== t.id); listeners.forEach((l) => l()) }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
