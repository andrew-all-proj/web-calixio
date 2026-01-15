import { useState } from 'react'
import { apiFetch, getErrorMessage } from './api'

type UseRoomsParams = {
  setStatus: (value: string) => void
  setError: (value: string) => void
  apiFetchAuth: (path: string, options?: RequestInit) => Promise<any>
  hasAuth: boolean
  initialRoomId: string
}

export default function useRooms({ setStatus, setError, apiFetchAuth, hasAuth, initialRoomId }: UseRoomsParams) {
  const [roomName, setRoomName] = useState('demo')
  const [roomId, setRoomId] = useState(initialRoomId)
  const [livekitToken, setLivekitToken] = useState('')

  async function onCreateRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('Creating room...')
    try {
      const data = await apiFetchAuth('/rooms', {
        method: 'POST',
        body: JSON.stringify({ name: roomName })
      })
      setRoomId(data.id)
      setStatus(`Room created: ${data.name}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    }
  }

  async function onEndRoom(e: React.SyntheticEvent) {
    e.preventDefault()
    setError('')
    setStatus('Ending room...')
    try {
      await apiFetchAuth(`/rooms/${roomId}/end`, { method: 'POST' })
      setStatus('Room ended')
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    }
  }

  async function requestLivekitToken() {
    if (!roomId) {
      setError('Room ID is missing')
      return ''
    }
    setStatus('Requesting LiveKit token...')
    try {
      const data = hasAuth
        ? await apiFetchAuth(`/rooms/${roomId}/join`, { method: 'POST' })
        : await apiFetch(`/rooms/${roomId}/join`, { method: 'POST' })
      setLivekitToken(data.token)
      setStatus('LiveKit token issued')
      return data.token
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
      return ''
    }
  }

  return {
    roomName,
    roomId,
    livekitToken,
    setRoomName,
    setRoomId,
    setLivekitToken,
    onCreateRoom,
    onEndRoom,
    requestLivekitToken
  }
}
