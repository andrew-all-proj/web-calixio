import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routePaths } from '@/shared/config/routes'
import styles from './RegisterForm.module.css'
import { authApi } from '../../api/authApi'
import { useAuthStore } from '../../model/useAuthStore'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const RegisterForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const isEmailValid = emailPattern.test(email)
    const isPasswordValid = password.length >= 6
    const isNameValid = name.trim().length > 0

    setNameError(isNameValid ? '' : t('register.form.nameError'))
    setEmailError(isEmailValid ? '' : t('register.form.emailError'))
    setPasswordError(isPasswordValid ? '' : t('register.form.passwordError'))

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    try {
      await authApi.register({ name: name.trim(), email, password })
      const tokens = await authApi.login({ email, password })
      const accessToken = tokens.accessToken ?? tokens.token ?? tokens.access_token
      if (!accessToken) {
        setSubmitError(t('register.form.submitError'))
        return
      }
      setAuth({ email, accessToken })
      setPassword('')
      setName('')
      navigate(routePaths.rooms)
    } catch {
      setSubmitError(t('register.form.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <h3>{t('register.form.title')}</h3>
        <Link className={styles.login} to={routePaths.home}>
          {t('register.form.login')}
        </Link>
      </div>
      <label className={styles.field}>
        <span>{t('register.form.name')}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (nameError) {
              setNameError('')
            }
          }}
          placeholder={t('register.form.namePlaceholder')}
          required
        />
        {nameError ? <span className={styles.error}>{nameError}</span> : null}
      </label>
      <label className={styles.field}>
        <span>{t('register.form.email')}</span>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (emailError) {
              setEmailError('')
            }
          }}
          placeholder="name@example.com"
          required
        />
        {emailError ? <span className={styles.error}>{emailError}</span> : null}
      </label>
      <label className={styles.field}>
        <span>{t('register.form.password')}</span>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (passwordError) {
              setPasswordError('')
            }
          }}
          placeholder="••••••••"
          required
        />
        {passwordError ? <span className={styles.error}>{passwordError}</span> : null}
      </label>
      {submitError ? <span className={styles.error}>{submitError}</span> : null}
      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? t('register.form.loading') : t('register.form.submit')}
      </button>
    </form>
  )
}
