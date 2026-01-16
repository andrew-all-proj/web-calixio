import { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './RoomsPage.module.css'

interface RoomActionsProps {
  joinValue: string
  createName: string
  isAuthenticated: boolean
  isCreating: boolean
  onJoinValueChange: (value: string) => void
  onCreateNameChange: (value: string) => void
  onCreate: (event: FormEvent<HTMLFormElement>) => void
}

export const RoomActions = ({
  joinValue,
  createName,
  isAuthenticated,
  isCreating,
  onJoinValueChange,
  onCreateNameChange,
  onCreate
}: RoomActionsProps) => {
  const { t } = useTranslation()

  return (
    <div className={styles.actions}>
      <div className={styles.join}>
        <input
          type="text"
          value={joinValue}
          onChange={(event) => onJoinValueChange(event.target.value)}
          placeholder={t('rooms.join.placeholder')}
          required
        />
      </div>
      {isAuthenticated ? (
        <form className={styles.create} onSubmit={onCreate}>
          <input
            type="text"
            value={createName}
            onChange={(event) => onCreateNameChange(event.target.value)}
            placeholder={t('rooms.create.placeholder')}
            required
          />
          <button type="submit" disabled={isCreating}>
            {isCreating ? t('rooms.create.loading') : t('rooms.create.cta')}
          </button>
        </form>
      ) : null}
    </div>
  )
}
