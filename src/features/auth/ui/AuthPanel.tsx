import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/model/useAuthStore'
import { routePaths } from '@/shared/config/routes'
import styles from './AuthPanel.module.css'

type AuthMode = 'login' | 'register'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AuthPanel = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordStrength = useMemo(() => {
    if (!password) {
      return 0
    }

    let strength = 0
    if (password.length >= 8) {
      strength += 1
    }
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength += 1
    }
    if (/\d/.test(password)) {
      strength += 1
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 1
    }

    return strength
  }, [password])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const normalizedEmail = email.trim()
    if (!emailPattern.test(normalizedEmail)) {
      setError('Введите корректный email')
      return
    }

    if (!name.trim()) {
      setError('Укажите имя')
      return
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Пароль должен быть не менее 8 символов')
        return
      }

      if (password !== confirmPassword) {
        setError('Пароли не совпадают')
        return
      }

      if (!agreedToTerms) {
        setError('Подтвердите согласие с условиями')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        await authApi.register({
          name: name.trim(),
          email: normalizedEmail,
          password
        })
      }

      const tokens = await authApi.login({ email: normalizedEmail, password })
      const accessToken = tokens.accessToken ?? tokens.token ?? tokens.access_token

      if (!accessToken) {
        setError('Не удалось получить токен авторизации')
        return
      }

      setAuth({
        email: normalizedEmail,
        accessToken,
        name: name.trim() || tokens.name || null
      })

      navigate(routePaths.dashboard)
    } catch {
      setError(mode === 'login' ? 'Ошибка входа, проверьте данные' : 'Ошибка регистрации')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section
      className={`glass-card ${styles.card}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className={styles.switcher}>
        <button
          type="button"
          className={mode === 'login' ? styles.active : ''}
          onClick={() => setMode('login')}
        >
          Вход
        </button>
        <button
          type="button"
          className={mode === 'register' ? styles.active : ''}
          onClick={() => setMode('register')}
        >
          Регистрация
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.leadingIcon}>
            <User size={18} />
          </span>
          <input
            type="text"
            className={`glass-input ${styles.inputWithIcon}`}
            style={{ paddingLeft: '56px' }}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Имя"
            autoComplete="name"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.leadingIcon}>
            <Mail size={18} />
          </span>
          <input
            type="email"
            className={`glass-input ${styles.inputWithIcon}`}
            style={{ paddingLeft: '56px' }}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.leadingIcon}>
            <Lock size={18} />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            className={`glass-input ${styles.inputWithIcon} ${styles.inputWithAction}`}
            style={{ paddingLeft: '56px' }}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>

        {mode === 'register' ? (
          <>
            <label className={styles.field}>
              <span className={styles.leadingIcon}>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`glass-input ${styles.inputWithIcon}`}
                style={{ paddingLeft: '56px' }}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Подтвердите пароль"
                autoComplete="new-password"
                required
              />
            </label>

            <div className={styles.passwordStrength}>
              {[1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={passwordStrength >= level ? styles.filled : ''}
                />
              ))}
            </div>

            <label className={styles.checkbox}>
              <span className={styles.checkboxBox}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                />
                {agreedToTerms ? <Check size={12} className={styles.checkboxTick} /> : null}
              </span>
              <span>Я согласен с условиями использования</span>
            </label>
          </>
        ) : null}

        {error ? (
          <p className={styles.error}>
            <X size={16} />
            <span>{error}</span>
          </p>
        ) : null}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="brand-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Подождите...'
            : mode === 'login'
            ? 'Войти'
            : 'Создать аккаунт'}
        </motion.button>
      </form>
    </motion.section>
  )
}
