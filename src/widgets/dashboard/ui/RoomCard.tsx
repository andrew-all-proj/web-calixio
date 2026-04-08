import { DashboardRoom } from '@/entities/room/model/mockRooms'
import styles from './RoomCard.module.css'

interface RoomCardProps {
  room: DashboardRoom
  onOpen: (roomId: string) => void
}

export const RoomCard = ({ room, onOpen }: RoomCardProps) => {
  return (
    <article className={`glass-card ${styles.card}`} onClick={() => onOpen(room.id)}>
      <div className={styles.top}>
        <div>
          <h3>{room.name}</h3>
          <p>{room.currentMovie ?? 'Контент еще не выбран'}</p>
        </div>
        <span className={room.status === 'live' ? styles.live : styles.paused}>
          {room.status === 'live' ? 'Live' : 'Paused'}
        </span>
      </div>

      <div className={styles.meta}>
        <span>{room.isPrivate ? 'Приватная' : 'Публичная'}</span>
        <span>{room.participants.length} участников</span>
      </div>

      <button type="button" className={styles.enter}>
        Войти в комнату
      </button>
    </article>
  )
}
