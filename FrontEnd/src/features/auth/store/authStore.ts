import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/auth.types'

interface AuthStore {
  user: User | null
  token: string | null
  /**
   * Zustand persist hydration flag.
   * While false, route guards should avoid redirecting.
   */
  isHydrated: boolean

  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAuthenticated: () => Boolean(get().token && get().user),
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'kinevents-auth',
      onRehydrateStorage: () => (state) => {
        // after storage is rehydrated (or fails)
        if (state) state.isHydrated = true
      },
    },
  ),
)

