import { useEffect, useState } from 'react'
import { AppRouter } from './router'
import { authApi, useAuthStore } from '@/features/auth'
import { Loader } from '@/shared/ui/loader'

export const App = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true)

  useEffect(() => {
    let isActive = true
    const hasStoredAccessToken = Boolean(useAuthStore.getState().accessToken)

    const initAuth = async () => {
      try {
        const tokens = await authApi.refresh()
        const accessToken = tokens.accessToken ?? tokens.token ?? tokens.access_token
        if (!accessToken) {
          if (isActive && !hasStoredAccessToken) {
            logout()
          }
          return
        }
        if (isActive) {
          setAuth({ email: null, accessToken })
        }
      } catch {
        if (isActive && !hasStoredAccessToken) {
          logout()
        }
      } finally {
        if (isActive) {
          setIsAuthBootstrapping(false)
        }
      }
    }

    void initAuth()

    return () => {
      isActive = false
    }
  }, [logout, setAuth])

  if (isAuthBootstrapping) {
    return <Loader />
  }

  return <AppRouter />
}
