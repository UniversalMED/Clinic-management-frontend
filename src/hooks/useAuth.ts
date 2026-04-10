import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'

import { signInWithPassword, signOut } from '@/api/auth'
import { getMe } from '@/api/users'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import type { Permission, Profile, Role } from '@/types/user.types'
import {
  hasPermission as roleHasPermission,
  hasAllPermissions as roleHasAllPermissions,
  hasAnyPermission as roleHasAnyPermission,
} from '@/utils/permissions'
import { queryKeys } from '@/utils/queryKeys'

export function useAuth(): {
  user: Profile | null
  role: Role | null
  isLoading: boolean
  isAuthenticated: boolean
  hasPermission: (p: Permission) => boolean
  hasAllPermissions: (ps: Permission[]) => boolean
  hasAnyPermission: (ps: Permission[]) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
} {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setUser = useAuthStore((s) => s.setUser)
  const clearUser = useAuthStore((s) => s.clearUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    // Already hydrated — don't re-run on every component mount.
    if (useAuthStore.getState().isAuthenticated) return

    let cancelled = false

    async function hydrate() {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          if (!cancelled) {
            clearUser()
            setLoading(false)
          }
          return
        }

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timed out')), 10_000),
        )
        const profile = await Promise.race([getMe(), timeout])
        if (!cancelled) {
          setUser(profile)
          queryClient.setQueryData(queryKeys.users.me(), profile)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          clearUser()
          setLoading(false)
        }
      }
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [clearUser, queryClient, setLoading, setUser])

  const hasPermission = useCallback(
    (p: Permission) => {
      const r = user?.role
      return r ? roleHasPermission(r, p) : false
    },
    [user?.role],
  )

  const hasAllPermissions = useCallback(
    (ps: Permission[]) => {
      const r = user?.role
      return r ? roleHasAllPermissions(r, ps) : false
    },
    [user?.role],
  )

  const hasAnyPermission = useCallback(
    (ps: Permission[]) => {
      const r = user?.role
      return r ? roleHasAnyPermission(r, ps) : false
    },
    [user?.role],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const { error } = await signInWithPassword(email, password)
        if (error) {
          setLoading(false)
          throw new Error(error.message ?? 'Invalid email or password.')
        }
        try {
          const profile = await getMe()
          setUser(profile)
          queryClient.setQueryData(queryKeys.users.me(), profile)
        } catch {
          // Supabase auth succeeded but the backend rejected the token.
          // Most likely cause: custom_access_token_hook is not enabled in
          // Supabase → the JWT is missing user_role / clinic_id claims.
          await signOut()
          throw new Error(
            'Login succeeded but the server rejected your session. ' +
            'Ensure the custom_access_token_hook is enabled in Supabase.',
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [queryClient, setLoading, setUser],
  )

  const logout = useCallback(async () => {
    await signOut()
    clearUser()
    queryClient.removeQueries({ queryKey: queryKeys.users.me() })
    queryClient.clear()
  }, [clearUser, queryClient])

  return {
    user,
    role: user?.role ?? null,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    login,
    logout,
  }
}
