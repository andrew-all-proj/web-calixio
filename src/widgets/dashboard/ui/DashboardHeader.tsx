import styles from './DashboardHeader.module.css'

interface DashboardHeaderProps {
  search: string
  onSearchChange: (value: string) => void
  onCreate: () => void
}

export const DashboardHeader = ({
  search,
  onSearchChange,
  onCreate
}: DashboardHeaderProps) => {
  return (
    <header className={styles.header}>
      <div>
        <h1>Комнаты</h1>
      </div>

      <div className={styles.actions}>
        <input
          type="text"
          className="glass-input"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск комнат..."
        />
        <button type="button" className="brand-button" onClick={onCreate}>
          Создать комнату
        </button>
      </div>
    </header>
  )
}
