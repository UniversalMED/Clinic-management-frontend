import { create } from 'zustand'

import type { Profile } from '@/types/user.types'

type AuthState = {
  user: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (profile: Profile | null) => void
  clearUser: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,   // true until first session check completes
  isAuthenticated: false,
  setUser: (profile) =>
    set({ user: profile, isAuthenticated: profile !== null }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setLoading: (v) => set({ isLoading: v }),
}))
