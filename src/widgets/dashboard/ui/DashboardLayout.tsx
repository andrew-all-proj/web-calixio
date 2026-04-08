import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'
import { routePaths } from '@/shared/config/routes'
import { CosmicBackdrop } from '@/widgets/decor'
import { DashboardSidebar } from './DashboardSidebar'
import styles from './DashboardLayout.module.css'

export const DashboardLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate(routePaths.home)
  }

  return (
    <CosmicBackdrop>
      <div className={styles.layout}>
        <DashboardSidebar onLogout={handleLogout} />
        <Outlet />
      </div>
    </CosmicBackdrop>
  )
}

