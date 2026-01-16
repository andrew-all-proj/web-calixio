import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import { roomApi } from '@/entities/room'
import { useAuthStore } from '@/features/auth'
import { routePaths } from '@/shared/config/routes'
import { useLocalTracks, useRoomConnection } from '../model'
import { RoomActions, RoomWindow, ShareCard } from './'
import styles from './RoomsPage.module.css'

const normalizeRoomId = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const url = new URL(trimmed)
    const param = url.searchParams.get('roomId') || url.searchParams.get('room')
    if (param) {
      return param
    }
  } catch {
    // Not a URL, continue.
  }

  return trimmed
}

const RoomsPage = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [joinValue, setJoinValue] = useState('')
  const [createName, setCreateName] = useState('')
  const [joinError, setJoinError] = useState('')
  const [createError, setCreateError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const {
    localAudioTrack,
    localVideoTrack,
    isMicEnabled,
    isCamEnabled,
    isDeviceInitializing,
    toggleMic,
    toggleCam
  } = useLocalTracks()

  const { room, remoteTracks, connectWithToken, leaveRoom, clearRemoteTracks } =
    useRoomConnection({
      livekitUrl: import.meta.env.VITE_LIVEKIT_WS,
      getParticipantLabel: (participant) =>
        participant.identity || t('rooms.participant')
    })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const roomId = params.get('roomId') || params.get('room')
    if (roomId) {
      setJoinValue(roomId)
      setCurrentRoomId(roomId)
    }
  }, [location.search])

  useEffect(() => {
    if (currentRoomId) {
      setCopyState('idle')
    }
  }, [currentRoomId])

  useEffect(() => {
    if (!room || (!localAudioTrack && !localVideoTrack)) {
      return
    }

    const publishTrack = async (track: LocalAudioTrack | LocalVideoTrack) => {
      const publications = room.localParticipant.trackPublications ?? new Map()
      const hasTrack = Array.from(publications.values()).some(
        (publication) => publication.track === track
      )

      if (!hasTrack) {
        await room.localParticipant.publishTrack(track)
      }
    }

    if (localAudioTrack) {
      void publishTrack(localAudioTrack)
    }

    if (localVideoTrack) {
      void publishTrack(localVideoTrack)
    }
  }, [room, localAudioTrack, localVideoTrack])

  const joinRoom = async () => {
    setJoinError('')

    const roomId = normalizeRoomId(currentRoomId ?? joinValue)
    if (!roomId) {
      setJoinError(t('rooms.join.error'))
      return
    }

    setIsJoining(true)

    try {
      const response = await roomApi.joinRoom(roomId)
      const token = response.token
      const resolvedRoomId = response.room_id ?? response.id ?? response.roomId

      if (!token) {
        setJoinError(t('rooms.join.tokenError'))
        return
      }

      try {
        await connectWithToken(token)
        setCurrentRoomId(resolvedRoomId ?? null)
        setJoinValue(resolvedRoomId ?? '')
      } catch {
        setJoinError(t('rooms.join.connectError'))
      }
    } catch {
      setJoinError(t('rooms.join.requestError'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')

    if (!accessToken) {
      setCreateError(t('rooms.create.authError'))
      return
    }

    if (!createName.trim()) {
      setCreateError(t('rooms.create.nameError'))
      return
    }

    setIsCreating(true)

    try {
      const response = await roomApi.createRoom(accessToken, {
        name: createName.trim()
      })
      const roomId = response.id ?? response.roomId ?? response.room_id
      if (!roomId) {
        setCreateError(t('rooms.create.idError'))
        return
      }

      setCurrentRoomId(roomId)
      setJoinValue(roomId)
      setCreateName('')
    } catch {
      setCreateError(t('rooms.create.requestError'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleLeave = () => {
    leaveRoom()
    clearRemoteTracks()
  }

  const shareLink = useMemo(
    () =>
      currentRoomId
        ? `${window.location.origin}${routePaths.rooms}?roomId=${currentRoomId}`
        : '',
    [currentRoomId]
  )

  const handleCopy = async () => {
    if (!shareLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  const joinDisabled =
    isJoining || (!currentRoomId && !joinValue.trim()) || Boolean(room)

  return (
    <section className={styles.page}>
      {!room ? (
        <RoomActions
          joinValue={joinValue}
          createName={createName}
          isAuthenticated={isAuthenticated}
          isCreating={isCreating}
          onJoinValueChange={setJoinValue}
          onCreateNameChange={setCreateName}
          onCreate={handleCreate}
        />
      ) : null}
      {currentRoomId ? (
        <ShareCard
          shareLink={shareLink}
          copyState={copyState}
          onCopy={handleCopy}
        />
      ) : null}
      {joinError ? <p className={styles.error}>{joinError}</p> : null}
      {createError ? <p className={styles.error}>{createError}</p> : null}
      <div className={styles.stage}>
        <RoomWindow
          isConnected={Boolean(room)}
          isJoining={isJoining}
          joinDisabled={joinDisabled}
          localVideoTrack={localVideoTrack}
          remoteTracks={remoteTracks}
          onJoin={joinRoom}
          onLeave={handleLeave}
          isMicEnabled={isMicEnabled}
          isCamEnabled={isCamEnabled}
          isDeviceInitializing={isDeviceInitializing}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
        />
      </div>
    </section>
  )
}

export default RoomsPage
