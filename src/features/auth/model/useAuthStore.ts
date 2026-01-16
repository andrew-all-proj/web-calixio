import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (payload: {
    email: string
    accessToken: string
    refreshToken: string | null
  }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  email: null,
  accessToken: null,
  refreshToken: null,
  setAuth: ({ email, accessToken, refreshToken }) =>
    set({
      isAuthenticated: true,
      email,
      accessToken,
      refreshToken
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      email: null,
      accessToken: null,
      refreshToken: null
    })
}))
