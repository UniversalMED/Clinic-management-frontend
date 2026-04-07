import type { ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import type { Permission } from '@/types/user.types'

type PermissionGateProps = {
  permission: Permission
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps): ReactNode {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
