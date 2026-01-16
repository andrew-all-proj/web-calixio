import { PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routePaths } from '@/shared/config/routes'
import { LanguageSwitcher } from '@/widgets/language-switcher'
import { useAuthStore } from '@/features/auth'
import styles from './AppLayout.module.css'

export const AppLayout = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const handleLogout = () => {
    logout()
    navigate(routePaths.home)
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{t('app.kicker')}</p>
          <h2 className={styles.title}>{t('app.title')}</h2>
        </div>
        <nav className={styles.nav}>
          {isAuthenticated ? (
            <button
              type="button"
              className={location.pathname === routePaths.home ? styles.active : styles.link}
              onClick={handleLogout}
            >
              {t('nav.logout')}
            </button>
          ) : (
            <button
              type="button"
              className={styles.link}
              onClick={() => navigate(routePaths.home)}
            >
              {t('nav.login')}
            </button>
          )}
        </nav>
        <LanguageSwitcher />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
