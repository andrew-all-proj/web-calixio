import { useMemo, useState } from 'react'
import { VideoTrackItem } from '@/pages/rooms/model'
import styles from './RoomSidePanel.module.css'

interface ChatMessage {
  id: string
  author: string
  text: string
  time: string
}

interface RoomSidePanelProps {
  remoteTracks: VideoTrackItem[]
  localName: string
}

const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    author: 'Иван',
    text: 'Привет! Начинаем?',
    time: '20:10'
  },
  {
    id: 'm2',
    author: 'Мария',
    text: 'Да, я готова',
    time: '20:11'
  }
]

type Tab = 'chat' | 'participants' | 'video'

export const RoomSidePanel = ({ remoteTracks, localName }: RoomSidePanelProps) => {
  const [tab, setTab] = useState<Tab>('chat')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(initialMessages)

  const participants = useMemo(() => {
    const remote = remoteTracks.map((track, index) => ({
      id: track.id,
      name: track.label || `Участник ${index + 1}`
    }))

    return [{ id: 'local', name: `${localName} (вы)` }, ...remote]
  }, [localName, remoteTracks])

  const sendMessage = () => {
    if (!message.trim()) {
      return
    }

    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        author: localName,
        text: message.trim(),
        time
      }
    ])
    setMessage('')
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.tabs}>
        {(['chat', 'participants', 'video'] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={tab === item ? styles.active : ''}
          >
            {item === 'chat' ? 'Чат' : item === 'participants' ? 'Участники' : 'Видео'}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div className={styles.chat}>
          <div className={styles.messages}>
            {messages.map((item) => (
              <article key={item.id} className={styles.message}>
                <p>{item.author}</p>
                <span>{item.text}</span>
                <small>{item.time}</small>
              </article>
            ))}
          </div>
          <div className={styles.chatForm}>
            <input
              type="text"
              className="glass-input"
              placeholder="Написать сообщение..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  sendMessage()
                }
              }}
            />
            <button type="button" className="brand-button" onClick={sendMessage}>
              Отправить
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'participants' ? (
        <div className={styles.list}>
          {participants.map((item) => (
            <article key={item.id} className={styles.row}>
              <strong>{item.name}</strong>
              <span>online</span>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'video' ? (
        <div className={styles.placeholder}>
          Отдельный поток видеофайла пока в режиме заглушки.
        </div>
      ) : null}
    </aside>
  )
}
