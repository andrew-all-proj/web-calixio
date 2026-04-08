import { FormEvent, useState } from 'react'
import { motion } from 'motion/react'
import { Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { normalizeRoomInput } from '@/shared/lib/room/normalizeRoomInput'
import styles from './JoinRoomCard.module.css'

export const JoinRoomCard = () => {
  const navigate = useNavigate()
  const [roomInput, setRoomInput] = useState('')
  const [error, setError] = useState('')

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const roomId = normalizeRoomInput(roomInput)

    if (!roomId) {
      setError('Введите ID комнаты или ссылку')
      return
    }

    setError('')
    navigate(`/room/${roomId}`)
  }

  return (
    <motion.section
      className={`glass-card ${styles.card}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className={styles.header}>
        <h1>Присоединиться к просмотру</h1>
        <p>Введите ID или ссылку на комнату</p>
      </div>

      <form onSubmit={handleJoin} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.iconWrap}>
            <Video size={18} />
          </span>
          <input
            type="text"
            className={`glass-input ${styles.input}`}
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="ID комнаты или ссылка"
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="brand-button"
        >
          Присоединиться
        </motion.button>
      </form>
    </motion.section>
  )
}
