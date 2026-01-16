import { useTranslation } from 'react-i18next'
import styles from './RoomsPage.module.css'

interface ShareCardProps {
  shareLink: string
  copyState: 'idle' | 'copied' | 'error'
  onCopy: () => void
}

export const ShareCard = ({ shareLink, copyState, onCopy }: ShareCardProps) => {
  const { t } = useTranslation()

  return (
    <div className={styles.share}>
      <div>
        <span>{t('rooms.share.label')}</span>
        <input type="text" value={shareLink} readOnly />
      </div>
      <button type="button" onClick={onCopy}>
        {copyState === 'copied'
          ? t('rooms.share.copied')
          : copyState === 'error'
          ? t('rooms.share.error')
          : t('rooms.share.copy')}
      </button>
    </div>
  )
}
