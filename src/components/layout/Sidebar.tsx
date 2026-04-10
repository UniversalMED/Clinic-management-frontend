import type { ReactElement } from 'react'
import { NavLink } from 'react-router-dom'
import { Building2, LogOut } from 'lucide-react'

import {
  NAV_ITEMS,
  NAV_SECTIONS,
  SECTION_LABELS,
  type NavSection,
} from '@/router/navConfig'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useLabOrders } from '@/hooks/useLab'
import { useQueue } from '@/hooks/useQueue'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ')
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar(): ReactElement {
  const user = useAuthStore((s) => s.user)
  const { hasAnyPermission, logout } = useAuth()

  // Live counts for badge display — only fetched once, shared across the tree
  const { data: queueWaiting } = useQueue({ status: 'waiting', page_size: 1 })
  const { data: pendingOrders } = useLabOrders({ status: 'pending', page_size: 1 })

  const counts: Record<string, number> = {
    queue_waiting: queueWaiting?.count ?? 0,
    lab_pending: pendingOrders?.count ?? 0,
  }

  // Filter visible items once per render using the centralised permission check
  const visibleItems = NAV_ITEMS.filter((item) =>
    hasAnyPermission(item.requiredPermissions),
  )

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex shrink-0 items-start gap-2 border-b border-border p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
          <Building2 className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">Clinic</div>
          <div
            className="truncate text-xs text-muted-foreground"
            title={user?.clinic_id}
          >
            {user?.clinic_id ? `${user.clinic_id.slice(0, 8)}…` : '—'}
          </div>
        </div>
      </div>

      {/* Nav — fully config-driven, zero scattered permission logic */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section: NavSection) => {
          const items = visibleItems.filter((i) => i.section === section)
          if (items.length === 0) return null

          return (
            <div key={section}>
              <SectionLabel>{SECTION_LABELS[section]}</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const count = item.countKey ? counts[item.countKey] : 0

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) => navLinkClass(isActive)}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && <NavCount>{count}</NavCount>}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void logout()}
            aria-label="Sign out"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
