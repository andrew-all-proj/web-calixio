import { RegisterForm } from '@/features/auth'
import styles from './RegisterPage.module.css'

const RegisterPage = () => {
  return (
    <section className={styles.page}>
      <RegisterForm />
    </section>
  )
}

export default RegisterPage
