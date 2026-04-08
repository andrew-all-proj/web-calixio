import { useState } from 'react'
import { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { roomApi } from '@/entities/room'
import { useAuthStore } from '@/features/auth/model/useAuthStore'
import styles from './CreateRoomModal.module.css'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateRoomModal = ({ isOpen, onClose }: CreateRoomModalProps) => {
  const navigate = useNavigate()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleCreateRoom = async () => {
    setError('')
    const normalizedName = name.trim()

    if (!accessToken) {
      setError('Нужна авторизация для создания комнаты')
      return
    }

    if (!normalizedName) {
      setError('Введите название комнаты')
      return
    }

    if (normalizedName.length < 2 || normalizedName.length > 64) {
      setError('Название комнаты должно быть от 2 до 64 символов')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await roomApi.createRoom(accessToken, { name: normalizedName })

      const roomId = response.id ?? response.roomId ?? response.room_id
      if (!roomId) {
        setError('Комната создана, но ID не получен')
        return
      }

      setName('')
      onClose()
      navigate(`/room/${roomId}`)
    } catch (error) {
      const apiErrorCode =
        (error as AxiosError<{ error?: string }>).response?.data?.error

      if (apiErrorCode === 'unauthorized') {
        setError('Сессия истекла. Войдите заново.')
      } else if (apiErrorCode === 'validation_failed') {
        setError('Название комнаты должно быть от 2 до 64 символов')
      } else if (apiErrorCode === 'invalid_json') {
        setError('Некорректные данные запроса')
      } else {
        setError('Не удалось создать комнату')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`glass-card ${styles.modal}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose}>
          x
        </button>

        <h2>Создать новую комнату</h2>

        <div className={styles.group}>
          <label htmlFor="room-name">Название комнаты</label>
          <input
            id="room-name"
            className="glass-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Введите название"
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button
          type="button"
          className="brand-button"
          disabled={isSubmitting}
          onClick={handleCreateRoom}
        >
          {isSubmitting ? 'Создание...' : 'Создать комнату'}
        </button>
      </div>
    </div>
  )
}
