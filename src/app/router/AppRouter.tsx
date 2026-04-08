import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { routePaths } from '@/shared/config/routes'
import { Loader } from '@/shared/ui/loader'
import { useAuthStore } from '@/features/auth'
import { DashboardLayout } from '@/widgets/dashboard'

const HomePage = lazy(() => import('@/pages/home'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const RoomsPage = lazy(() => import('@/pages/rooms'))
const WatchRoomPage = lazy(() => import('@/pages/watch-room'))
const MoviesPage = lazy(() => import('@/pages/movies'))

export const AppRouter = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path={routePaths.home} element={<HomeRoute />} />
      <Route path={routePaths.register} element={<Navigate to={routePaths.home} replace />} />
      <Route element={<PrivateDashboardLayoutRoute />}>
        <Route path={routePaths.dashboard} element={<DashboardPage />} />
        <Route path={routePaths.rooms} element={<RoomsPage />} />
        <Route path={routePaths.movies} element={<MoviesPage />} />
      </Route>
      <Route path={routePaths.room} element={<WatchRoomPage />} />
      <Route path="*" element={<Navigate to={routePaths.home} replace />} />
    </Routes>
  </Suspense>
)

const HomeRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={routePaths.dashboard} replace />
  }

  return <HomePage />
}

const PrivateDashboardLayoutRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to={routePaths.home} replace />
  }

  return <DashboardLayout />
}
