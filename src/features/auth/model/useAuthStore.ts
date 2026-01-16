import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  accessToken: string | null
  setAuth: (payload: {
    email: string | null
    accessToken: string
  }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  email: null,
  accessToken: null,
  setAuth: ({ email, accessToken }) =>
    set({
      isAuthenticated: true,
      email,
      accessToken
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      email: null,
      accessToken: null
    })
}))
