import { useTranslation } from 'react-i18next'
import { RegisterForm } from '@/features/auth'
import styles from './RegisterPage.module.css'

const RegisterPage = () => {
  const { t } = useTranslation()

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>{t('register.title')}</h1>
        <p>{t('register.subtitle')}</p>
      </div>
      <RegisterForm />
    </section>
  )
}

export default RegisterPage
