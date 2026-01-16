import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createLocalTracks,
  LocalAudioTrack,
  LocalVideoTrack,
  Room,
  RoomEvent,
  Track
} from 'livekit-client'
import { useLocation } from 'react-router-dom'
import { roomApi } from '@/entities/room'
import { useAuthStore } from '@/features/auth'
import { routePaths } from '@/shared/config/routes'
import styles from './RoomsPage.module.css'

const livekitUrl = import.meta.env.VITE_LIVEKIT_WS

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

type TrackWithMute = {
  mute: () => Promise<void> | void
  unmute: () => Promise<void> | void
  isMuted?: boolean
}

type TrackWithSetMuted = {
  setMuted: (muted: boolean) => Promise<void> | void
  isMuted?: boolean
}

type TrackWithSetEnabled = {
  setEnabled: (enabled: boolean) => Promise<void> | void
  isEnabled?: boolean
}

const getTrackEnabled = (track: LocalAudioTrack | LocalVideoTrack) => {
  const maybe = track as unknown as { isMuted?: boolean; isEnabled?: boolean }

  if (typeof maybe.isMuted === 'boolean') {
    return !maybe.isMuted
  }

  if (typeof maybe.isEnabled === 'boolean') {
    return maybe.isEnabled
  }

  return true
}

const setTrackEnabled = async (
  track: LocalAudioTrack | LocalVideoTrack,
  enabled: boolean
) => {
  const withMute = track as unknown as TrackWithMute
  if ('mute' in withMute && 'unmute' in withMute) {
    if (enabled) {
      await withMute.unmute()
    } else {
      await withMute.mute()
    }
    return
  }

  const withSetMuted = track as unknown as TrackWithSetMuted
  if ('setMuted' in withSetMuted) {
    await withSetMuted.setMuted(!enabled)
    return
  }

  const withSetEnabled = track as unknown as TrackWithSetEnabled
  if ('setEnabled' in withSetEnabled) {
    await withSetEnabled.setEnabled(enabled)
  }
}

interface VideoTrackItem {
  id: string
  label: string
  track: Track
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
  const [room, setRoom] = useState<Room | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(
    null
  )
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(
    null
  )
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCamEnabled, setIsCamEnabled] = useState(true)
  const [isDeviceInitializing, setIsDeviceInitializing] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [remoteTracks, setRemoteTracks] = useState<VideoTrackItem[]>([])
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const audioElements = useRef<Map<string, HTMLMediaElement>>(new Map())

  useEffect(() => {
    return () => {
      room?.disconnect()
    }
  }, [room])

  useEffect(() => {
    if (currentRoomId) {
      setCopyState('idle')
    }
  }, [currentRoomId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const roomId = params.get('roomId') || params.get('room')
    if (roomId) {
      setJoinValue(roomId)
      setCurrentRoomId(roomId)
    }
  }, [location.search])

  useEffect(() => {
    if (!localVideoTrack || !localVideoRef.current) {
      return
    }

    localVideoTrack.attach(localVideoRef.current)

    return () => {
      localVideoTrack.detach(localVideoRef.current)
    }
  }, [localVideoTrack])

  useEffect(() => {
    if (!room && localVideoTrack && localVideoRef.current) {
      return
    }

    if (room && localVideoTrack && localVideoRef.current) {
      localVideoTrack.detach(localVideoRef.current)
    }
  }, [room, localVideoTrack])

  const ensureLocalTracks = useCallback(async (options: { audio?: boolean; video?: boolean }) => {
    if (isDeviceInitializing) {
      return
    }

    const shouldCreateAudio = options.audio && !localAudioTrack
    const shouldCreateVideo = options.video && !localVideoTrack

    if (!shouldCreateAudio && !shouldCreateVideo) {
      return
    }

    setIsDeviceInitializing(true)

    try {
      const tracks = await createLocalTracks({
        audio: shouldCreateAudio,
        video: shouldCreateVideo
      })

      const audioTrack = tracks.find(
        (track) => track.kind === Track.Kind.Audio
      ) as LocalAudioTrack | undefined
      const videoTrack = tracks.find(
        (track) => track.kind === Track.Kind.Video
      ) as LocalVideoTrack | undefined

        if (audioTrack) {
          setLocalAudioTrack(audioTrack)
          setIsMicEnabled(getTrackEnabled(audioTrack))
        }

        if (videoTrack) {
          setLocalVideoTrack(videoTrack)
          setIsCamEnabled(getTrackEnabled(videoTrack))
        }
    } catch {
      // Ignore device errors; controls can retry on click.
    } finally {
      setIsDeviceInitializing(false)
    }
  }, [isDeviceInitializing, localAudioTrack, localVideoTrack])

  useEffect(() => {
    void ensureLocalTracks({ audio: true, video: true })
  }, [ensureLocalTracks])

  useEffect(() => {
    const publishTrack = async (track: LocalAudioTrack | LocalVideoTrack) => {
      if (!room) {
        return
      }

      const publications =
        room.localParticipant.trackPublications ??
        room.localParticipant.tracks ??
        new Map()

      const hasTrack = Array.from(publications.values()).some(
        (publication) => publication.track === track
      )

      if (!hasTrack) {
        await room.localParticipant.publishTrack(track)
      }
    }

    if (room && localAudioTrack) {
      void publishTrack(localAudioTrack)
    }

    if (room && localVideoTrack) {
      void publishTrack(localVideoTrack)
    }
  }, [room, localAudioTrack, localVideoTrack])

  useEffect(() => {
    return () => {
      localAudioTrack?.stop()
      localVideoTrack?.stop()
    }
  }, [localAudioTrack, localVideoTrack])

  const setupRoom = async (token: string) => {
    const nextRoom = new Room({ autoSubscribe: true })

    const addRemoteTrack = (track: Track, participant: { identity?: string; sid: string }) => {
      if (track.kind !== Track.Kind.Video) {
        return
      }

      setRemoteTracks((prev) => {
        if (prev.some((item) => item.track === track)) {
          return prev
        }

        return [
          ...prev,
          {
            id: track.sid ?? `${participant.sid}-${track.kind}`,
            label: participant.identity || t('rooms.participant'),
            track
          }
        ]
      })
    }

    nextRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach()
        audioElements.current.set(track.sid ?? participant.sid, element)
        return
      }

      addRemoteTrack(track, participant)
    })

    nextRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        const key = track.sid ?? participant.sid
        const element = audioElements.current.get(key)
        if (element) {
          track.detach(element)
          element.remove()
          audioElements.current.delete(key)
        }
        return
      }

      if (track.kind !== Track.Kind.Video) {
        return
      }
      setRemoteTracks((prev) => prev.filter((item) => item.track !== track))
    })

    nextRoom.on(RoomEvent.ParticipantConnected, (participant) => {
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track) {
          addRemoteTrack(publication.track, participant)
        }
      })
    })

    nextRoom.on(RoomEvent.Disconnected, () => {
      audioElements.current.forEach((element, key) => {
        element.remove()
        audioElements.current.delete(key)
      })
      setRoom(null)
      setRemoteTracks([])
    })

    await nextRoom.connect(livekitUrl, token)
    setRoom(nextRoom)

    nextRoom.participants.forEach((participant) => {
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track) {
          addRemoteTrack(publication.track, participant)
        }
      })
    })
  }

  const joinRoom = async () => {
    setJoinError('')

    if (!livekitUrl) {
      setJoinError(t('rooms.join.envError'))
      return
    }

    const roomId = normalizeRoomId(currentRoomId ?? joinValue)
    if (!roomId) {
      setJoinError(t('rooms.join.error'))
      return
    }

    setIsJoining(true)

    try {
      const response = await roomApi.joinRoom(roomId, {}, accessToken ?? undefined)
      const token = response.token
      const resolvedRoomId = response.room_id ?? response.id ?? response.roomId ?? roomId

      if (!token) {
        setJoinError(t('rooms.join.tokenError'))
        return
      }

      try {
        await setupRoom(token)
        setCurrentRoomId(resolvedRoomId)
        setJoinValue(resolvedRoomId)
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

    if (!livekitUrl) {
      setCreateError(t('rooms.create.envError'))
      return
    }

    if (!createName.trim()) {
      setCreateError(t('rooms.create.nameError'))
      return
    }

    setIsCreating(true)

    try {
      const response = await roomApi.createRoom(
        accessToken,
        { name: createName.trim() }
      )
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
    room?.disconnect()
  }

  const shareLink = currentRoomId
    ? `${window.location.origin}${routePaths.rooms}?roomId=${currentRoomId}`
    : ''

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

  const toggleMic = async () => {
    if (!localAudioTrack) {
      await ensureLocalTracks({ audio: true })
      return
    }
    const next = !getTrackEnabled(localAudioTrack)
    await setTrackEnabled(localAudioTrack, next)
    setIsMicEnabled(next)
  }

  const toggleCam = async () => {
    if (!localVideoTrack) {
      await ensureLocalTracks({ video: true })
      return
    }
    const next = !getTrackEnabled(localVideoTrack)
    await setTrackEnabled(localVideoTrack, next)
    setIsCamEnabled(next)
  }

  return (
    <section className={styles.page}>
      {!room ? (
        <div className={styles.actions}>
          <div className={styles.join}>
            <input
              type="text"
              value={joinValue}
              onChange={(event) => setJoinValue(event.target.value)}
              placeholder={t('rooms.join.placeholder')}
              required
            />
          </div>
          {isAuthenticated ? (
            <form className={styles.create} onSubmit={handleCreate}>
              <input
                type="text"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={t('rooms.create.placeholder')}
                required
              />
              <button type="submit" disabled={isCreating}>
                {isCreating ? t('rooms.create.loading') : t('rooms.create.cta')}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      {currentRoomId ? (
        <div className={styles.share}>
          <div>
            <span>{t('rooms.share.label')}</span>
            <input type="text" value={shareLink} readOnly />
          </div>
          <button type="button" onClick={handleCopy}>
            {copyState === 'copied'
              ? t('rooms.share.copied')
              : copyState === 'error'
              ? t('rooms.share.error')
              : t('rooms.share.copy')}
          </button>
        </div>
      ) : null}
      {joinError ? <p className={styles.error}>{joinError}</p> : null}
      {createError ? <p className={styles.error}>{createError}</p> : null}
      <div className={styles.stage}>
        <div className={styles.roomWindow}>
          {room ? (
            <button type="button" className={styles.close} onClick={handleLeave}>
              x
            </button>
          ) : null}
          {room ? (
            <div className={styles.gridView}>
              <VideoTile label={t('rooms.you')} track={localVideoTrack} muted />
              {remoteTracks.map((item) => (
                <VideoTile key={item.id} label={item.label} track={item.track} />
              ))}
            </div>
          ) : (
            <div className={styles.preview}>
              <video ref={localVideoRef} autoPlay playsInline muted />
              <div className={styles.centerText}>
                <span>{t('rooms.nameLabel')}</span>
                <strong>{t('rooms.guest')}</strong>
              </div>
            </div>
          )}
          <div className={styles.controls}>
            <div className={styles.iconGroup}>
              <button
                type="button"
                className={`${styles.iconButton} ${
                  isMicEnabled ? styles.iconActive : styles.iconMuted
                }`}
                onClick={toggleMic}
                aria-pressed={!isMicEnabled}
                disabled={isDeviceInitializing}
              >
                {t('rooms.mic')}
              </button>
              <button
                type="button"
                className={`${styles.iconButton} ${
                  isCamEnabled ? styles.iconActive : styles.iconMuted
                }`}
                onClick={toggleCam}
                aria-pressed={!isCamEnabled}
                disabled={isDeviceInitializing}
              >
                {t('rooms.cam')}
              </button>
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={joinRoom}
              disabled={isJoining || Boolean(room) || !currentRoomId && !joinValue.trim()}
            >
              {isJoining ? t('rooms.join.loading') : t('rooms.connect')}
            </button>
            <button type="button" className={styles.iconButton}>
              {t('rooms.settings')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

interface VideoTileProps {
  label: string
  track: Track | null
  muted?: boolean
}

const VideoTile = ({ label, track, muted = false }: VideoTileProps) => {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!track || !ref.current) {
      return
    }

    track.attach(ref.current)

    return () => {
      track.detach(ref.current)
    }
  }, [track])

  return (
    <div className={styles.tile}>
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  )
}

export default RoomsPage
