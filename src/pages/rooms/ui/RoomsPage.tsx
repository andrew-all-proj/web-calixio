import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { roomApi, RoomListItem } from '@/entities/room'
import { useAuthStore } from '@/features/auth'
import { CreateRoomModal } from '@/features/room-create'
import { Lock, Pause, Play, Plus, Search, Users } from 'lucide-react'
import { useEffect } from 'react'
import styles from './RoomsPage.module.css'

const RoomsPage = () => {
  const navigate = useNavigate()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [roomsError, setRoomsError] = useState('')

  const loadRooms = async () => {
    if (!accessToken) {
      setRooms([])
      return
    }
    setIsLoadingRooms(true)
    setRoomsError('')
    try {
      const data = await roomApi.listMyRooms(accessToken)
      setRooms(data)
    } catch {
      setRoomsError('Не удалось загрузить список комнат')
    } finally {
      setIsLoadingRooms(false)
    }
  }

  useEffect(() => {
    void loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rooms, searchQuery]
  )

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Комнаты</h1>
          </div>

          <div className={styles.actions}>
            <div className={styles.searchWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск комнат..."
                className={`glass-input ${styles.searchInput}`}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className={`brand-button ${styles.createButton}`}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              <span>Создать комнату</span>
            </motion.button>
          </div>
        </header>

        {roomsError ? <p className={styles.error}>{roomsError}</p> : null}

        <section className={styles.grid}>
          <AnimatePresence>
            {isLoadingRooms ? (
              <p className={styles.empty}>Загрузка комнат...</p>
            ) : null}
            {filteredRooms.map((room, index) => (
              <motion.article
                key={room.id}
                className={styles.card}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => navigate(`/room/${room.id}`)}
              >
                  <div className={styles.cardGlow} />

                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h2>{room.name}</h2>
                      <p>Комната владельца</p>
                    </div>

                    <div className={styles.cardMeta}>
                      <Lock size={15} className={styles.metaIcon} />

                      <span
                        className={`${styles.status} ${
                          room.status === 'active' ? styles.statusLive : styles.statusPaused
                        }`}
                      >
                        {room.status === 'active' ? <Play size={11} /> : <Pause size={11} />}
                        {room.status === 'active' ? 'Live' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.participants}>
                    <div className={styles.avatars}>
                      <span className={styles.avatar}>В</span>
                    </div>

                    <span className={styles.count}>
                      <Users size={14} />
                      1
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className={styles.enterButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/room/${room.id}`)
                    }}
                  >
                    Войти в комнату
                  </motion.button>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>
      </main>
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          void loadRooms()
        }}
      />
    </>
  )
}

export default RoomsPage
