import type { QueryClient } from '@tanstack/react-query'

import { getMe } from '@/api/users'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { queryKeys } from '@/utils/queryKeys'

let _initialized = false

/**
 * Checks the existing Supabase session and loads the user profile once.
 * Must be called once at app startup (AuthInitializer in App.tsx).
 */
export async function initAuth(queryClient: QueryClient): Promise<void> {
  if (_initialized) return
  _initialized = true

  const { clearUser, setUser, setLoading } = useAuthStore.getState()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      clearUser()
      return
    }

    const profile = await getMe()
    setUser(profile)
    queryClient.setQueryData(queryKeys.users.me(), profile)
  } catch {
    clearUser()
  } finally {
    setLoading(false)
  }
}
