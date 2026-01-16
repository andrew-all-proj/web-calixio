import { useEffect } from 'react'
import { AppRouter } from './router'
import { AppLayout } from '@/widgets/layout'
import { authApi, useAuthStore } from '@/features/auth'

export const App = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let isActive = true

    const initAuth = async () => {
      try {
        const tokens = await authApi.refresh()
        const accessToken = tokens.accessToken ?? tokens.token ?? tokens.access_token
        if (!accessToken) {
          if (isActive) {
            logout()
          }
          return
        }
        if (isActive) {
          setAuth({ email: null, accessToken })
        }
      } catch {
        if (isActive) {
          logout()
        }
      }
    }

    void initAuth()

    return () => {
      isActive = false
    }
  }, [logout, setAuth])

  return (
    <AppLayout>
      <AppRouter />
    </AppLayout>
  )
}
