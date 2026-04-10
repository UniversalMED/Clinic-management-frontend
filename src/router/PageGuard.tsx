import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import Forbidden from '@/pages/Forbidden'
import { useAuthStore } from '@/store/auth.store'
import type { Permission } from '@/types/user.types'
import { hasAllPermissions, hasAnyPermission } from '@/utils/permissions'

type PageGuardProps = {
  /**
   * Permissions required to render `children`.
   *
   * `mode='any'` (default) — passes if the user holds at least one.
   * `mode='all'`           — passes only if the user holds every one.
   */
  permissions: Permission[]
  mode?: 'any' | 'all'
  children: ReactNode
}

/**
 * Wraps a page element with a permission check.
 *
 * - Not authenticated → redirect to /login
 * - Authenticated but unauthorised → render inline 403 page (URL preserved)
 * - Authorised → render children
 *
 * @example
 *   { path: 'billing', element: <PageGuard permissions={['view_billing']}><Billing /></PageGuard> }
 *
 * @example — require ALL permissions
 *   <PageGuard permissions={['manage_billing', 'void_invoice']} mode="all">
 *     <DangerousAction />
 *   </PageGuard>
 */
export function PageGuard({ permissions, mode = 'any', children }: PageGuardProps) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  // Still hydrating — render nothing to avoid a flash of the 403 page
  if (isLoading) return null

  // Not authenticated — send to login
  if (!user) return <Navigate to="/login" replace />

  const granted =
    mode === 'all'
      ? hasAllPermissions(user.role, permissions)
      : hasAnyPermission(user.role, permissions)

  // Authenticated but no permission — show 403 inline (URL stays the same
  // so the user sees exactly which route they were denied access to)
  if (!granted) return <Forbidden />

  return <>{children}</>
}
