import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, MoreVertical, UserCheck, UserX, Users } from 'lucide-react'
import { usersApi } from '@/api/users.api'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types'

const ROLES = ['Admin', 'Staff', 'Faculty', 'ReviewCommittee'] as const

const roleVariantMap: Record<string, 'default' | 'secondary' | 'info' | 'warning' | 'success'> = {
  Admin: 'default',
  Staff: 'info',
  Faculty: 'success',
  ReviewCommittee: 'warning',
}

const roleLabelMap: Record<string, string> = {
  Admin: 'Quản trị viên',
  Staff: 'Nhân viên',
  Faculty: 'Giảng viên',
  ReviewCommittee: 'Hội đồng',
}

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu ít nhất 8 ký tự'),
  roles: z.string().min(1, 'Vui lòng chọn vai trò'),
  department: z.string().optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-8 w-8 rounded-md" /></td>
    </tr>
  )
}

function ActionMenu({ user, onToggleActive }: { user: User; onToggleActive: (user: User) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
        <MoreVertical className="h-4 w-4" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 top-10 z-20 w-48 rounded-lg border bg-background shadow-lg py-1"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.12 }}
            >
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => { onToggleActive(user); setOpen(false) }}
              >
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Vô hiệu hóa</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Kích hoạt</span>
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined }),
    staleTime: 30_000,
  })

  const users = data?.data?.data?.items ?? []
  const total = data?.data?.data?.total ?? 0
  const totalPages = data?.data?.data?.totalPages ?? 1

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserFormData) =>
      usersApi.create({
        fullName: dto.fullName,
        email: dto.email,
        password: dto.password,
        roles: [dto.roles],
        department: dto.department,
      }),
    onSuccess: () => {
      toast.success('Tạo người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      reset()
    },
    onError: () => toast.error('Không thể tạo người dùng', 'Vui lòng thử lại'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (user: User) => usersApi.update(user._id, { isActive: !user.isActive }),
    onSuccess: (_, user) => {
      toast.success(user.isActive ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Thao tác thất bại'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) })

  const onSubmit = (formData: CreateUserFormData) => createMutation.mutate(formData)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const start = total === 0 ? 0 : (page - 1) * 20 + 1
  const end = Math.min(page * 20, total)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Quản lý tài khoản và phân quyền trong hệ thống"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </Button>
        }
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm theo tên, email..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">Tìm kiếm</Button>
      </form>

      {/* Table card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Người dùng</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Vai trò</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Bộ môn</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ngày tạo</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-2">
                    <ErrorState onRetry={() => void refetch()} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-2">
                    <EmptyState
                      title="Không tìm thấy người dùng"
                      description="Chưa có người dùng nào hoặc không khớp từ khóa tìm kiếm."
                      icon={<Users className="h-8 w-8 text-muted-foreground" />}
                      action={
                        <Button onClick={() => setDialogOpen(true)}>
                          <Plus className="h-4 w-4" />
                          Thêm người dùng
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    key={user._id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant={roleVariantMap[role] ?? 'secondary'}>
                            {roleLabelMap[role] ?? role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <ActionMenu user={user} onToggleActive={(u) => toggleActiveMutation.mutate(u)} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !isError && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {start}–{end} / {total} người dùng
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogClose onClose={() => setDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input id="fullName" placeholder="Nguyễn Văn A" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="example@fpt.edu.vn" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu *</Label>
              <Input id="password" type="password" placeholder="Ít nhất 8 ký tự" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roles">Vai trò *</Label>
              <Select id="roles" {...register('roles')}>
                <option value="">-- Chọn vai trò --</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{roleLabelMap[r]}</option>
                ))}
              </Select>
              {errors.roles && <p className="text-xs text-destructive">{errors.roles.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department">Bộ môn / Khoa</Label>
              <Input id="department" placeholder="Kỹ thuật phần mềm" {...register('department')} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); reset() }}
              >
                Hủy
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Tạo tài khoản
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
