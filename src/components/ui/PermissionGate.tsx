import type { ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import type { Permission } from '@/types/user.types'

type PermissionGateProps = {
  /** Single permission (backward-compatible shorthand). */
  permission?: Permission
  /** Multiple permissions checked according to `mode`. */
  permissions?: Permission[]
  /**
   * 'any' (default) — passes if the user has at least one of the permissions.
   * 'all'           — passes only if the user has every permission listed.
   */
  mode?: 'any' | 'all'
  /** Rendered when the check fails. Defaults to null. */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Renders `children` only when the current user satisfies the permission check.
 *
 * @example — single permission (backward-compat)
 *   <PermissionGate permission="manage_queue">…</PermissionGate>
 *
 * @example — any of multiple permissions
 *   <PermissionGate permissions={['order_lab_test', 'process_lab_order']}>…</PermissionGate>
 *
 * @example — all permissions required
 *   <PermissionGate permissions={['manage_billing', 'void_invoice']} mode="all">…</PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  mode = 'any',
  fallback = null,
  children,
}: PermissionGateProps): ReactNode {
  const { hasAllPermissions, hasAnyPermission } = useAuth()

  // Normalise: merge single `permission` into the array form
  const resolved: Permission[] = [
    ...(permission ? [permission] : []),
    ...(permissions ?? []),
  ]

  const granted =
    resolved.length === 0
      ? true
      : mode === 'all'
        ? hasAllPermissions(resolved)
        : hasAnyPermission(resolved)

  return granted ? <>{children}</> : <>{fallback}</>
}
