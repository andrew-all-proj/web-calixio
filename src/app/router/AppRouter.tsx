import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { routePaths } from '@/shared/config/routes'
import { Loader } from '@/shared/ui/loader'
import { useAuthStore } from '@/features/auth'

const HomePage = lazy(() => import('@/pages/home'))
const RegisterPage = lazy(() => import('@/pages/register'))
const RoomsPage = lazy(() => import('@/pages/rooms'))

export const AppRouter = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path={routePaths.home} element={<HomeRoute />} />
      <Route path={routePaths.register} element={<RegisterPage />} />
      <Route path={routePaths.rooms} element={<RoomsPage />} />
    </Routes>
  </Suspense>
)

const HomeRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={routePaths.rooms} replace />
  }

  return <HomePage />
}
