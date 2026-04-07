import type { ReactElement } from 'react'
import {
  Building2,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  Microscope,
  ScrollText,
  UserCog,
  Users,
  UsersRound,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useLabOrders } from '@/hooks/useLab'
import { useQueue } from '@/hooks/useQueue'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

function navLinkClass(active: boolean): string {
  return cn(
    'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors',
    active
      ? 'border-l-2 border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-100'
      : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground',
  )
}

function NavCount({ children }: { children: number }) {
  if (children <= 0) return null
  return (
    <Badge
      variant="secondary"
      className="ml-auto min-w-[1.25rem] justify-center bg-teal-100 px-1.5 text-xs text-teal-900 dark:bg-teal-900/40 dark:text-teal-100"
    >
      {children > 99 ? '99+' : children}
    </Badge>
  )
}

function SectionLabel({ children }: { children: string }): ReactElement {
  return (
    <p className="mb-2 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ')
}

export function Sidebar(): ReactElement {
  const user = useAuthStore((s) => s.user)
  const { hasPermission } = useAuth()

  const { data: queueWaiting } = useQueue({
    status: 'waiting',
    page_size: 1,
  })
  const waitingCount = queueWaiting?.count ?? 0

  const { data: pendingOrders } = useLabOrders({
    status: 'pending',
    page_size: 1,
  })
  const pendingLabCount = pendingOrders?.count ?? 0

  const canQueue =
    hasPermission('manage_queue') || hasPermission('start_visit_from_queue')
  const canLab =
    hasPermission('order_lab_test') ||
    hasPermission('process_lab_order') ||
    hasPermission('write_lab_result')
  const canBilling =
    hasPermission('manage_billing') || hasPermission('void_invoice')
  const canUsers = hasPermission('manage_users')
  const canAudit = hasPermission('view_audit_log')

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start gap-2 border-b border-border p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
          <Building2 className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            Clinic
          </div>
          <div className="truncate text-xs text-muted-foreground" title={user?.clinic_id}>
            {user?.clinic_id
              ? `${user.clinic_id.slice(0, 8)}…`
              : '—'}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <div>
          <SectionLabel>Clinic</SectionLabel>
          <div className="flex flex-col gap-0.5">
            <NavLink to="/dashboard" className={({ isActive }) => navLinkClass(isActive)}>
              <LayoutGrid className="size-4 shrink-0" aria-hidden />
              Dashboard
            </NavLink>
            <NavLink to="/patients" className={({ isActive }) => navLinkClass(isActive)}>
              <Users className="size-4 shrink-0" aria-hidden />
              Patients
            </NavLink>
            <NavLink to="/visits" className={({ isActive }) => navLinkClass(isActive)}>
              <ClipboardList className="size-4 shrink-0" aria-hidden />
              Visits
            </NavLink>
            {canQueue ? (
              <NavLink to="/queue" className={({ isActive }) => navLinkClass(isActive)}>
                <UsersRound className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate">Queue</span>
                <NavCount>{waitingCount}</NavCount>
              </NavLink>
            ) : null}
          </div>
        </div>

        {(canLab || canBilling) ? (
          <div>
            <SectionLabel>Lab &amp; billing</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {canLab ? (
                <NavLink to="/lab" className={({ isActive }) => navLinkClass(isActive)}>
                  <Microscope className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1 truncate">Lab</span>
                  <NavCount>{pendingLabCount}</NavCount>
                </NavLink>
              ) : null}
              {canBilling ? (
                <NavLink to="/billing" className={({ isActive }) => navLinkClass(isActive)}>
                  <CreditCard className="size-4 shrink-0" aria-hidden />
                  Billing
                </NavLink>
              ) : null}
            </div>
          </div>
        ) : null}

        {(canUsers || canAudit) ? (
          <div>
            <SectionLabel>Admin</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {canUsers ? (
                <NavLink to="/users" className={({ isActive }) => navLinkClass(isActive)}>
                  <UserCog className="size-4 shrink-0" aria-hidden />
                  Users
                </NavLink>
              ) : null}
              {canAudit ? (
                <NavLink to="/audit" className={({ isActive }) => navLinkClass(isActive)}>
                  <ScrollText className="size-4 shrink-0" aria-hidden />
                  Audit
                </NavLink>
              ) : null}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mt-auto shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-muted text-xs">
              {user?.full_name ? initials(user.full_name) : '—'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {user?.full_name ?? 'Signed out'}
            </div>
            <div className="truncate text-xs capitalize text-muted-foreground">
              {user?.role ? roleLabel(user.role) : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
