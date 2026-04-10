import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import type { Profile, Role } from '@/types/user.types'
import { useAuth } from '@/hooks/useAuth'
import { useUsers, useCreateUser, useUpdateRole } from '@/hooks/useUsers'
import { formatDate } from '@/utils/formatters'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Role metadata
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  lab_tech: 'Lab Tech',
  receptionist: 'Receptionist',
}

const ROLE_BADGE_STYLES: Record<Role, string> = {
  super_admin:
    'border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-100',
  admin:
    'border-violet-300 bg-violet-100 text-violet-950 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-100',
  doctor:
    'border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100',
  lab_tech:
    'border-teal-300 bg-teal-100 text-teal-950 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-100',
  receptionist:
    'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100',
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        ROLE_BADGE_STYLES[role] ?? 'border-border bg-muted text-muted-foreground',
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Role tabs
// ---------------------------------------------------------------------------

type RoleFilter = '' | Role

const ROLE_TABS: { id: RoleFilter; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'admin', label: 'Admin' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'lab_tech', label: 'Lab Tech' },
  { id: 'receptionist', label: 'Receptionist' },
]

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Change Role Dialog
// ---------------------------------------------------------------------------

function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: {
  user: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateRole = useUpdateRole()
  const [role, setRole] = useState<Role>(user?.role ?? 'doctor')

  // Sync initial value when user changes
  if (user && role !== user.role && !updateRole.isPending) {
    setRole(user.role)
  }

  function handleSave() {
    if (!user) return
    updateRole.mutate(
      { id: user.id, data: { role } },
      {
        onSuccess: () => {
          toast.success('Role updated')
          onOpenChange(false)
        },
        onError: () => toast.error('Failed to update role'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            {user?.full_name ?? 'User'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter showCloseButton>
          <Button
            onClick={handleSave}
            disabled={role === user?.role || updateRole.isPending}
          >
            {updateRole.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Invite User Dialog
// ---------------------------------------------------------------------------

function InviteUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createUser = useCreateUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('doctor')

  function reset() {
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('doctor')
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSubmit() {
    if (!email.trim() || !password || !fullName.trim()) return
    createUser.mutate(
      { email: email.trim(), password, full_name: fullName.trim(), role },
      {
        onSuccess: () => {
          toast.success('User invited')
          handleOpenChange(false)
        },
        onError: () => toast.error('Failed to invite user'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Create a new staff account for this clinic.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Full name *</Label>
            <Input
              id="invite-name"
              placeholder="Dr. Selam Tesfaye"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="selam@clinic.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-password">Password *</Label>
            <Input
              id="invite-password"
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={
              !email.trim() || !password || !fullName.trim() || createUser.isPending
            }
          >
            {createUser.isPending ? 'Inviting…' : 'Invite user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(
  onChangeRole: (user: Profile) => void,
): ColumnDef<Profile>[] {
  return [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.full_name}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      id: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="xs"
          variant="outline"
          onClick={() => onChangeRole(row.original)}
        >
          Change role
        </Button>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// Users page
// ---------------------------------------------------------------------------

export default function Users() {
  const { hasPermission, isLoading } = useAuth()

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [changeRoleUser, setChangeRoleUser] = useState<Profile | null>(null)
  const [changeRoleOpen, setChangeRoleOpen] = useState(false)

  const { data, isLoading: usersLoading } = useUsers({
    role: roleFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  // Guard: redirect if not admin
  if (!isLoading && !hasPermission('manage_users')) {
    return <Navigate to="/dashboard" replace />
  }

  function openChangeRole(user: Profile) {
    setChangeRoleUser(user)
    setChangeRoleOpen(true)
  }

  const columns = buildColumns(openChangeRole)
  const tableData = data ?? { count: 0, next: null, previous: null, results: [] }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4 border-b">
        <div className="flex" role="tablist" aria-label="Filter by role">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={roleFilter === tab.id}
              onClick={() => {
                setRoleFilter(tab.id)
                setPage(1)
              }}
              className={cn(
                '-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
                roleFilter === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pb-2">
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Invite user
          </Button>
        </div>
      </div>

      <DataTable
        data={tableData}
        columns={columns}
        isLoading={usersLoading}
        page={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        emptyMessage={
          roleFilter
            ? `No ${ROLE_LABELS[roleFilter as Role] ?? roleFilter} users.`
            : 'No users found.'
        }
      />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ChangeRoleDialog
        user={changeRoleUser}
        open={changeRoleOpen}
        onOpenChange={(open) => {
          setChangeRoleOpen(open)
          if (!open) setChangeRoleUser(null)
        }}
      />
    </div>
  )
}
