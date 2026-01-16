import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/features/auth'
import styles from './HomePage.module.css'

const HomePage = () => {
  const { t } = useTranslation()
  const [room, setRoom] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <section className={styles.page}>
      <form className={styles.join} onSubmit={handleSubmit}>
        <h1>{t('home.join.title')}</h1>
        <p>{t('home.join.subtitle')}</p>
        <label className={styles.field}>
          <span className={styles.label}>{t('home.join.label')}</span>
          <input
            type="text"
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            placeholder={t('home.join.placeholder')}
            required
          />
        </label>
        <button type="submit" className={styles.link}>
          {t('home.join.cta')}
        </button>
      </form>
      <LoginForm />
    </section>
  )
}

export default HomePage
