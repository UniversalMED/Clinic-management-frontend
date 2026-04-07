import type { ReactElement } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'

export function ProtectedRoute(): ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
