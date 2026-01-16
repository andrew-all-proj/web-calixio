import { useTranslation } from 'react-i18next'
import styles from './LanguageSwitcher.module.css'

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' }
] as const

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  return (
    <div className={styles.switcher}>
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          className={
            i18n.language === language.code ? styles.active : styles.button
          }
          onClick={() => i18n.changeLanguage(language.code)}
        >
          {language.label}
        </button>
      ))}
    </div>
  )
}
