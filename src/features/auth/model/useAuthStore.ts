import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  name: string | null
  accessToken: string | null
  setAuth: (payload: {
    email: string | null
    accessToken: string
    name?: string | null
  }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  email: null,
  name: null,
  accessToken: null,
  setAuth: ({ email, accessToken, name }) =>
    set({
      isAuthenticated: true,
      email,
      name: name ?? null,
      accessToken
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      email: null,
      name: null,
      accessToken: null
    })
}))
