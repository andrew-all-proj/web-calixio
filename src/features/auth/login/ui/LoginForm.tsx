import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../model/useAuthStore'
import { routePaths } from '@/shared/config/routes'
import { authApi } from '../../api/authApi'
import styles from './LoginForm.module.css'

export const LoginForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const tokens = await authApi.login({ email, password })
      const accessToken = tokens.accessToken ?? tokens.token ?? tokens.access_token
      if (!accessToken) {
        setSubmitError(t('auth.error'))
        return
      }
      setAuth({ email, accessToken })
      setPassword('')
      navigate(routePaths.rooms)
    } catch {
      setSubmitError(t('auth.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <h3>{t('auth.title')}</h3>
        <Link className={styles.register} to={routePaths.register}>
          {t('auth.register')}
        </Link>
      </div>
      <label className={styles.field}>
        <span>{t('auth.email')}</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          required
        />
      </label>
      <label className={styles.field}>
        <span>{t('auth.password')}</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
      </label>
      {submitError ? <span className={styles.error}>{submitError}</span> : null}
      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? t('auth.loading') : t('auth.login')}
      </button>
    </form>
  )
}
