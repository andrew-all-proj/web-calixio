import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { routePaths } from '@/shared/config/routes'
import styles from './DashboardSidebar.module.css'
import {
  BrandVideoIcon,
  CameraIcon,
  FilmGridIcon,
  GearIcon,
  HomeIcon
} from './DashboardIcons'

interface DashboardSidebarProps {
  onLogout: () => void
}

type MenuItem = {
  id: 'home' | 'rooms' | 'movies' | 'settings'
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
}

const menuItems = [
  { id: 'home', label: 'Главная', icon: HomeIcon, path: routePaths.dashboard },
  { id: 'rooms', label: 'Комнаты', icon: CameraIcon, path: routePaths.rooms },
  { id: 'movies', label: 'Мои фильмы', icon: FilmGridIcon, path: routePaths.movies },
  { id: 'settings', label: 'Настройки', icon: GearIcon }
] as const satisfies readonly MenuItem[]

const getMenuIdByPath = (pathname: string): MenuItem['id'] => {
  if (pathname === routePaths.rooms) {
    return 'rooms'
  }
  if (pathname === routePaths.movies) {
    return 'movies'
  }
  return 'home'
}

export const DashboardSidebar = ({ onLogout }: DashboardSidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const pathMenuId = useMemo(
    () => getMenuIdByPath(location.pathname),
    [location.pathname]
  )
  const [activeMenuId, setActiveMenuId] = useState<MenuItem['id']>(pathMenuId)

  useEffect(() => {
    setActiveMenuId(pathMenuId)
  }, [pathMenuId])

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <BrandVideoIcon />
        </div>
        <strong>WatchTogether</strong>
      </div>

      <nav className={styles.menu}>
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            type="button"
            className={`${styles.menuItem} ${activeMenuId === item.id ? styles.active : ''}`}
            style={{ '--item-index': index } as CSSProperties}
            whileHover={{ scale: 1.04, x: 4 }}
            whileTap={{ scale: 0.96 }}
            animate={
              activeMenuId === item.id
                ? {
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      '0 0 0 rgba(37,99,235,0)',
                      '0 14px 30px rgba(37,99,235,0.45)',
                      '0 10px 26px rgba(37,99,235,0.36)'
                    ]
                  }
                : { scale: 1, boxShadow: '0 0 0 rgba(37,99,235,0)' }
            }
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={() => {
              setActiveMenuId(item.id)
              if (item.path) {
                navigate(item.path)
              }
            }}
          >
            <item.icon className={styles.icon} />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <button type="button" className={styles.logout} onClick={onLogout}>
        Выйти
      </button>
    </aside>
  )
}
