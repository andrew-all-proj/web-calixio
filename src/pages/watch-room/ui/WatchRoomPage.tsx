import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChatMessage as LiveKitChatMessage,
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteParticipant,
  RoomEvent,
  Track
} from 'livekit-client'
import { isAxiosError } from 'axios'
import Hls from 'hls.js'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  ChevronLeft,
  Film,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  Pause,
  Play,
  Send,
  Settings,
  Monitor,
  Users,
  Video,
  VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import { mediaApi, MediaItem, resolvePlaybackManifestURL } from '@/entities/media'
import { roomApi, RoomPlaybackState, RoomState } from '@/entities/room'
import { useAuthStore } from '@/features/auth'
import { useLocalTracks, useRoomConnection } from '@/pages/rooms/model'
import { routePaths } from '@/shared/config/routes'
import { VideoTrackView } from '@/shared/ui/video-track'
import { CosmicBackdrop } from '@/widgets/decor'
import styles from './WatchRoomPage.module.css'

type SideTab = 'chat' | 'participants' | 'video'
type RoomMode = 'movie' | 'conference'

interface ChatMessage {
  id: string
  author: string
  text: string
  time: string
}

interface ChatHistorySnapshot {
  version: 1
  roomId: string
  messages: ChatMessage[]
}

interface RoomMovie {
  id: string
  title: string
  thumbnail: string
}

interface PlaybackStateEnvelope {
  type?: string
  state?: RoomPlaybackState
}

const ROOM_STATE_TOPIC = 'room_state'
const ROOM_STATE_CHAT_PREFIX = '__room_state__:'
const CHAT_HISTORY_REQUEST_PREFIX = '__chat_history_req__:'
const CHAT_HISTORY_SNAPSHOT_PREFIX = '__chat_history_v1__:'
const PLAYBACK_STATE_TOPIC = 'playback_state'
const PLAYBACK_HEARTBEAT_MS = 3000
const DRIFT_IGNORE_MS = 300
const DRIFT_SOFT_MS = 1200
const CHAT_HISTORY_LIMIT = 80
const GUEST_NAME_STORAGE_KEY = 'calixio:guest-display-name'

const chatHistoryStorageKey = (roomId: string) => `calixio:chat-history:${roomId}`

const trimChatHistory = (messages: ChatMessage[]) => messages.slice(-CHAT_HISTORY_LIMIT)

const mergeChatHistory = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const byID = new Map<string, ChatMessage>()
  for (const item of [...current, ...incoming]) {
    if (!item?.id) {
      continue
    }
    byID.set(item.id, item)
  }
  return trimChatHistory(Array.from(byID.values()))
}

const readGuestName = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  try {
    return window.localStorage.getItem(GUEST_NAME_STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

const detectIOS = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const ua = window.navigator.userAgent || ''
  const platform = window.navigator.platform || ''
  const maxTouchPoints = window.navigator.maxTouchPoints || 0

  return /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

const WatchRoomPage = () => {
  const navigate = useNavigate()
  const { roomId = '' } = useParams<{ roomId: string }>()
  const accessToken = useAuthStore((state) => state.accessToken)
  const authName = useAuthStore((state) => state.name)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [roomMode, setRoomMode] = useState<RoomMode>('conference')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [masterVolume, setMasterVolume] = useState(70)
  const [micSensitivity, setMicSensitivity] = useState(50)
  const [showModeSelect, setShowModeSelect] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [availableMovies, setAvailableMovies] = useState<RoomMovie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<RoomMovie | null>(null)
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [movieLoadError, setMovieLoadError] = useState('')
  const [moviePlaybackSrc, setMoviePlaybackSrc] = useState('')
  const [moviePlaybackError, setMoviePlaybackError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<SideTab>('chat')
  const [draftMessage, setDraftMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [remoteParticipantsList, setRemoteParticipantsList] = useState<
    { id: string; name: string; isLocal: false }[]
  >([])
  const [isIOS] = useState(() => detectIOS())
  const [displayName, setDisplayName] = useState(
    () => authName || (accessToken ? 'Админ' : readGuestName())
  )
  const [showGuestNamePrompt, setShowGuestNamePrompt] = useState(
    () => !accessToken && !authName && !readGuestName()
  )
  const [guestNameInput, setGuestNameInput] = useState('')
  const [guestNameError, setGuestNameError] = useState('')
  const movieVideoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const manifestBlobURLRef = useRef<string | null>(null)
  const availableMoviesRef = useRef<RoomMovie[]>([])
  const displayNameRef = useRef(displayName)
  const joinInFlightRef = useRef(false)
  const joinedRoomIdRef = useRef<string | null>(null)
  const playbackStateRef = useRef<RoomPlaybackState | null>(null)
  const isApplyingPlaybackRef = useRef(false)
  const playbackRateResetTimerRef = useRef<number | null>(null)
  const playbackHeartbeatTimerRef = useRef<number | null>(null)
  const wasMobileRef = useRef<boolean | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])

  const {
    localAudioTrack,
    localVideoTrack,
    isMicEnabled,
    isCamEnabled,
    isDeviceInitializing,
    ensureLocalTracks,
    toggleMic,
    toggleCam
  } = useLocalTracks()

  const getParticipantLabel = useCallback(
    (participant: { name?: string; identity?: string }) =>
      participant.name || participant.identity || 'Участник',
    []
  )

  const {
    room,
    remoteTracks,
    connectWithToken,
    leaveRoom,
    clearRemoteTracks,
    setOutputVolume
  } = useRoomConnection({
    livekitUrl: import.meta.env.VITE_LIVEKIT_WS,
    getParticipantLabel
  })

  const setMovieManifest = useCallback(
    (manifest?: string, manifestURL?: string | null) => {
      if (manifestBlobURLRef.current) {
        URL.revokeObjectURL(manifestBlobURLRef.current)
        manifestBlobURLRef.current = null
      }
      if (isIOS && manifestURL) {
        setMoviePlaybackSrc(resolvePlaybackManifestURL(manifestURL))
        return
      }
      if (!manifest) {
        setMoviePlaybackSrc('')
        return
      }
      const blobURL = URL.createObjectURL(
        new Blob([manifest], { type: 'application/vnd.apple.mpegurl' })
      )
      manifestBlobURLRef.current = blobURL
      setMoviePlaybackSrc(blobURL)
    },
    [isIOS]
  )

  const clearPlaybackRateResetTimer = useCallback(() => {
    if (playbackRateResetTimerRef.current) {
      window.clearTimeout(playbackRateResetTimerRef.current)
      playbackRateResetTimerRef.current = null
    }
  }, [])

  const parseIncomingPlaybackState = useCallback((raw: string): RoomPlaybackState | null => {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') {
        return null
      }

      const envelope = parsed as PlaybackStateEnvelope
      const state = envelope.type === 'playback_state' && envelope.state ? envelope.state : (parsed as RoomPlaybackState)
      if (!state || typeof state !== 'object') {
        return null
      }

      if (
        typeof state.roomId !== 'string' ||
        typeof state.mediaId !== 'string' ||
        (state.status !== 'playing' && state.status !== 'paused' && state.status !== 'seeking') ||
        typeof state.positionMs !== 'number' ||
        typeof state.playbackRate !== 'number' ||
        typeof state.updatedAt !== 'number' ||
        typeof state.version !== 'number' ||
        typeof state.hostId !== 'string'
      ) {
        return null
      }
      return state
    } catch {
      return null
    }
  }, [])

  const applyPlaybackState = useCallback(
    (state: RoomPlaybackState) => {
      const current = playbackStateRef.current
      if (current && state.version < current.version) {
        return
      }
      playbackStateRef.current = state

      const video = movieVideoRef.current
      if (!video || roomMode !== 'movie') {
        return
      }
      if (selectedMovie && state.mediaId && state.mediaId !== selectedMovie.id) {
        return
      }

      clearPlaybackRateResetTimer()
      const baseRate = state.playbackRate > 0 ? state.playbackRate : 1
      const clampTime = (seconds: number) => {
        const bounded = Math.max(0, seconds)
        if (!Number.isFinite(video.duration) || video.duration <= 0) {
          return bounded
        }
        return Math.min(bounded, Math.max(0, video.duration - 0.05))
      }
      const safePositionSeconds = clampTime(state.positionMs / 1000)
      const setRateSafely = (rate: number) => {
        if (isIOS) {
          return
        }
        try {
          video.playbackRate = rate
        } catch {
          // Ignore playbackRate assignment errors on unsupported environments.
        }
      }
      const setPosition = () => {
        if (Math.abs(video.currentTime * 1000 - state.positionMs) > DRIFT_IGNORE_MS) {
          video.currentTime = safePositionSeconds
        }
      }

      isApplyingPlaybackRef.current = true

      if (state.status === 'paused' || state.status === 'seeking') {
        setRateSafely(baseRate)
        setPosition()
        video.pause()
        setIsPlaying(false)
        window.setTimeout(() => {
          isApplyingPlaybackRef.current = false
        }, 0)
        return
      }

      const elapsedMs = Math.max(0, Date.now() - state.updatedAt)
      const expectedPositionMs = state.positionMs + elapsedMs * baseRate
      const actualPositionMs = video.currentTime * 1000
      const driftMs = expectedPositionMs - actualPositionMs
      const absDriftMs = Math.abs(driftMs)

      if (isIOS) {
        if (absDriftMs > DRIFT_IGNORE_MS) {
          video.currentTime = clampTime(expectedPositionMs / 1000)
        }
      } else if (absDriftMs <= DRIFT_IGNORE_MS) {
        setRateSafely(baseRate)
      } else if (absDriftMs <= DRIFT_SOFT_MS) {
        const correction = driftMs > 0 ? Math.min(baseRate + 0.05, 1.2) : Math.max(baseRate - 0.05, 0.8)
        setRateSafely(correction)
        playbackRateResetTimerRef.current = window.setTimeout(() => {
          setRateSafely(baseRate)
          playbackRateResetTimerRef.current = null
        }, 1200)
      } else {
        video.currentTime = clampTime(expectedPositionMs / 1000)
        setRateSafely(baseRate)
      }

      void video.play().catch(async () => {
        video.muted = true
        try {
          await video.play()
        } catch {
          // Ignore autoplay failures; next user interaction will resume.
        }
      })
      setIsPlaying(true)
      window.setTimeout(() => {
        isApplyingPlaybackRef.current = false
      }, 0)
    },
    [clearPlaybackRateResetTimer, isIOS, roomMode, selectedMovie]
  )

  const applyRoomState = useCallback(
    (state?: RoomState) => {
      if (!state || state.mode === 'conference') {
        setRoomMode('conference')
        setSelectedMovie(null)
        setMoviePlaybackError('')
        setMovieManifest()
        playbackStateRef.current = null
        setIsPlaying(false)
        return
      }

      const mediaID = state.media_id
      if (!mediaID) {
        setRoomMode('conference')
        setSelectedMovie(null)
        setMoviePlaybackError('')
        setMovieManifest()
        playbackStateRef.current = null
        setIsPlaying(false)
        return
      }

      const knownMovie = availableMoviesRef.current.find((item) => item.id === mediaID)
      setSelectedMovie(
        knownMovie ?? {
          id: mediaID,
          title: 'Выбранный фильм',
          thumbnail:
            state.playback?.previewUrl ||
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop'
        }
      )
      setRoomMode('movie')
      setActiveTab('video')

      if (state.playback?.manifest || state.playback?.manifestUrl) {
        setMoviePlaybackError('')
        setMovieManifest(state.playback?.manifest, state.playback?.manifestUrl)
      } else {
        setMovieManifest()
        setMoviePlaybackError('Фильм пока недоступен для воспроизведения')
      }
    },
    [setMovieManifest]
  )

  const parseIncomingRoomState = useCallback((raw: string): RoomState | null => {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      const envelope = parsed as { type?: string; state?: RoomState }
      if (envelope.type === 'room_state' && envelope.state) {
        return envelope.state
      }
      return parsed as RoomState
    } catch {
      return null
    }
  }, [])

  const broadcastRoomState = useCallback(
    async (state: RoomState) => {
      if (!room) {
        return
      }
      const payloadText = JSON.stringify({ type: 'room_state', state })

      try {
        await room.localParticipant.publishData(new TextEncoder().encode(payloadText), {
          reliable: true,
          topic: ROOM_STATE_TOPIC
        })
      } catch {
        // Ignore transport errors and try fallback below.
      }

      try {
        await room.localParticipant.sendChatMessage(`${ROOM_STATE_CHAT_PREFIX}${payloadText}`)
      } catch {
        // Ignore fallback errors.
      }
    },
    [room]
  )

  const broadcastPlaybackState = useCallback(
    async (state: RoomPlaybackState) => {
      if (!room) {
        return
      }
      const payloadText = JSON.stringify({ type: 'playback_state', state })
      try {
        await room.localParticipant.publishData(new TextEncoder().encode(payloadText), {
          reliable: true,
          topic: PLAYBACK_STATE_TOPIC
        })
      } catch {
        // Ignore transport errors.
      }
    },
    [room]
  )

  const buildPlaybackPayload = useCallback(
    (statusOverride?: RoomPlaybackState['status']) => {
      const video = movieVideoRef.current
      if (!video || !selectedMovie) {
        return null
      }
      const status: RoomPlaybackState['status'] =
        statusOverride ?? (video.paused ? 'paused' : 'playing')
      return {
        mediaId: selectedMovie.id,
        status,
        positionMs: Math.max(0, Math.round(video.currentTime * 1000)),
        playbackRate: video.playbackRate > 0 ? video.playbackRate : 1
      }
    },
    [selectedMovie]
  )

  const syncPlaybackState = useCallback(
    async (statusOverride?: RoomPlaybackState['status']) => {
      if (!accessToken || !roomId) {
        return
      }
      const payload = buildPlaybackPayload(statusOverride)
      if (!payload) {
        return
      }
      try {
        const state = await roomApi.updateRoomPlaybackState(roomId, accessToken, payload)
        playbackStateRef.current = state
        await broadcastPlaybackState(state)
      } catch {
        // Ignore sync failures; next action/heartbeat will retry.
      }
    },
    [accessToken, broadcastPlaybackState, buildPlaybackPayload, roomId]
  )

  useEffect(() => {
    const updateLayout = () => {
      const mobile = window.innerWidth < 980
      setIsMobile(mobile)
      const wasMobile = wasMobileRef.current
      wasMobileRef.current = mobile

      if (wasMobile === null) {
        setSidebarOpen(!mobile)
        return
      }

      if (wasMobile !== mobile) {
        setSidebarOpen(!mobile)
      }
    }

    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  useEffect(() => {
    if (authName) {
      setDisplayName(authName)
      setShowGuestNamePrompt(false)
      return
    }
    if (accessToken) {
      setDisplayName((prev) => prev.trim() || 'Админ')
      setShowGuestNamePrompt(false)
      return
    }
    const savedGuestName = readGuestName()
    if (savedGuestName) {
      setDisplayName(savedGuestName)
      setShowGuestNamePrompt(false)
      return
    }
    if (!displayNameRef.current.trim()) {
      setShowGuestNamePrompt(true)
      setGuestNameInput('')
    }
  }, [accessToken, authName])

  useEffect(() => {
    displayNameRef.current = displayName
  }, [displayName])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!roomId) {
      return
    }
    try {
      const raw = window.localStorage.getItem(chatHistoryStorageKey(roomId))
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw) as ChatMessage[]
      if (!Array.isArray(parsed)) {
        return
      }
      const sanitized = parsed.filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.author === 'string' &&
          typeof item.text === 'string' &&
          typeof item.time === 'string'
      )
      setMessages(trimChatHistory(sanitized))
    } catch {
      // ignore broken local cache
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) {
      return
    }
    try {
      window.localStorage.setItem(
        chatHistoryStorageKey(roomId),
        JSON.stringify(trimChatHistory(messages))
      )
    } catch {
      // ignore storage failures
    }
  }, [messages, roomId])

  useEffect(() => {
    setOutputVolume(isMuted ? 0 : masterVolume)
  }, [isMuted, masterVolume, setOutputVolume])

  useEffect(() => {
    const loadMovies = async () => {
      if (!accessToken) {
        setAvailableMovies([])
        return
      }
      setIsLoadingMovies(true)
      setMovieLoadError('')
      try {
        const movies = await mediaApi.listMyMedia(accessToken)
        const normalized = movies
          .filter((item) => {
            const status = item.status.trim().toLowerCase()
            return status === 'ready'
          })
          .map((item: MediaItem) => ({
            id: item.id,
            title: item.title,
            thumbnail:
              item.previewUrl ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop'
          }))
        setAvailableMovies(normalized)
      } catch {
        setMovieLoadError('Не удалось загрузить список фильмов')
      } finally {
        setIsLoadingMovies(false)
      }
    }

    void loadMovies()
  }, [accessToken])

  useEffect(() => {
    availableMoviesRef.current = availableMovies
  }, [availableMovies])

  useEffect(() => {
    if (!selectedMovie) {
      return
    }
    const knownMovie = availableMovies.find((item) => item.id === selectedMovie.id)
    if (!knownMovie) {
      return
    }
    setSelectedMovie(knownMovie)
  }, [availableMovies, selectedMovie])

  useEffect(() => {
    const video = movieVideoRef.current
    if (!video) {
      return
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (!moviePlaybackSrc) {
      video.removeAttribute('src')
      video.load()
      return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = moviePlaybackSrc
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.attachMedia(video)
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(moviePlaybackSrc)
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          setMoviePlaybackError('Ошибка воспроизведения HLS потока')
        }
      })
      return
    }

    setMoviePlaybackError('Ваш браузер не поддерживает HLS воспроизведение')
  }, [moviePlaybackSrc])

  useEffect(() => {
    const video = movieVideoRef.current
    if (!video || roomMode !== 'movie') {
      return
    }

    const reapplyLatestState = () => {
      const state = playbackStateRef.current
      if (!state) {
        return
      }
      applyPlaybackState(state)
    }

    video.addEventListener('loadedmetadata', reapplyLatestState)
    video.addEventListener('canplay', reapplyLatestState)
    return () => {
      video.removeEventListener('loadedmetadata', reapplyLatestState)
      video.removeEventListener('canplay', reapplyLatestState)
    }
  }, [applyPlaybackState, roomMode, selectedMovie?.id])

  useEffect(() => {
    return () => {
      clearPlaybackRateResetTimer()
      if (playbackHeartbeatTimerRef.current) {
        window.clearInterval(playbackHeartbeatTimerRef.current)
        playbackHeartbeatTimerRef.current = null
      }
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (manifestBlobURLRef.current) {
        URL.revokeObjectURL(manifestBlobURLRef.current)
        manifestBlobURLRef.current = null
      }
    }
  }, [clearPlaybackRateResetTimer])

  useEffect(() => {
    const video = movieVideoRef.current
    if (!video) {
      return
    }
    if (isPlaying) {
      void video.play()
      return
    }
    video.pause()
  }, [isPlaying])

  useEffect(() => {
    let isActive = true

    const join = async () => {
      if (joinInFlightRef.current) {
        return
      }
      setJoinError('')

      if (!roomId) {
        setJoinError('Комната не найдена')
        return
      }
      if (!accessToken && !displayNameRef.current.trim()) {
        setShowGuestNamePrompt(true)
        setJoinError('Введите имя для входа в комнату')
        return
      }
      if (joinedRoomIdRef.current === roomId) {
        return
      }

      joinInFlightRef.current = true
      setIsJoining(true)

      try {
        const response = await roomApi.joinRoom(roomId, {
          user_name: displayNameRef.current.trim() || 'Гость'
        })

        if (!response.token) {
          if (isActive) {
            setJoinError('Сервер не вернул токен для подключения')
          }
          return
        }

        applyRoomState(response.state)
        await connectWithToken(response.token)
        joinedRoomIdRef.current = roomId
      } catch {
        if (isActive) {
          setJoinError('Не удалось подключиться к комнате')
        }
      } finally {
        joinInFlightRef.current = false
        if (isActive) {
          setIsJoining(false)
        }
      }
    }

    void join()

    return () => {
      isActive = false
      joinedRoomIdRef.current = null
      joinInFlightRef.current = false
      leaveRoom()
      clearRemoteTracks()
    }
  }, [accessToken, applyRoomState, clearRemoteTracks, connectWithToken, displayName, leaveRoom, roomId])

  const submitGuestName = () => {
    const trimmed = guestNameInput.trim()
    if (!trimmed) {
      setGuestNameError('Введите имя')
      return
    }

    setGuestNameError('')
    try {
      window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, trimmed)
    } catch {
      // ignore storage failures
    }
    setDisplayName(trimmed)
    setGuestNameInput(trimmed)
    setShowGuestNamePrompt(false)
    setJoinError('')
  }

  useEffect(() => {
    if (!room) {
      return
    }
    void ensureLocalTracks({ audio: true, video: true })
  }, [ensureLocalTracks, room])

  useEffect(() => {
    if (!room || !roomId || roomMode !== 'movie') {
      return
    }

    let isActive = true
    const loadPlaybackState = async () => {
      try {
        const state = await roomApi.getRoomPlaybackState(roomId)
        if (!isActive) {
          return
        }
        applyPlaybackState(state)
      } catch {
        // Ignore when playback was not initialized yet.
      }
    }

    void loadPlaybackState()
    return () => {
      isActive = false
    }
  }, [applyPlaybackState, room, roomId, roomMode])

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
        if (track.kind === Track.Kind.Audio) {
          await room.localParticipant.publishTrack(track, { red: false })
          return
        }
        await room.localParticipant.publishTrack(track)
      }
    }

    if (localAudioTrack) {
      void publishTrack(localAudioTrack)
    }

    if (localVideoTrack) {
      void publishTrack(localVideoTrack)
    }
  }, [localAudioTrack, localVideoTrack, room])

  useEffect(() => {
    if (!room || !accessToken) {
      return
    }

    const onParticipantConnected = (_participant: RemoteParticipant) => {
      void syncPlaybackState()
    }

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected)
    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected)
    }
  }, [accessToken, room, syncPlaybackState])

  useEffect(() => {
    if (!room) {
      setRemoteParticipantsList([])
      return
    }

    const syncParticipants = () => {
      const next = Array.from(room.remoteParticipants.values()).map((participant) => ({
        id: participant.sid,
        name: getParticipantLabel(participant),
        isLocal: false as const
      }))
      setRemoteParticipantsList(next)
    }

    syncParticipants()
    room.on(RoomEvent.ParticipantConnected, syncParticipants)
    room.on(RoomEvent.ParticipantDisconnected, syncParticipants)

    return () => {
      room.off(RoomEvent.ParticipantConnected, syncParticipants)
      room.off(RoomEvent.ParticipantDisconnected, syncParticipants)
    }
  }, [getParticipantLabel, room])

  const participantCount = useMemo(() => remoteParticipantsList.length + 1, [remoteParticipantsList.length])
  const participants = useMemo(
    () => [
      { id: 'local', name: `${displayName} (Вы)`, isLocal: true },
      ...remoteParticipantsList
    ],
    [displayName, remoteParticipantsList]
  )

  const sendMessage = () => {
    const text = draftMessage.trim()
    if (!text || !room) {
      return
    }

    void room.localParticipant.sendChatMessage(text)
    setDraftMessage('')
  }

  useEffect(() => {
    if (!room) {
      setMessages([])
      return
    }

    const toUiMessage = (
      message: LiveKitChatMessage,
      participantName: string
    ): ChatMessage => {
      const createdAt = message.timestamp ? new Date(message.timestamp) : new Date()
      const time = `${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`
      return {
        id: message.id,
        author: participantName,
        text: message.message,
        time
      }
    }

    const onChatMessage = (
      message: LiveKitChatMessage,
      participant?: { name?: string; identity?: string }
    ) => {
      if (message.message.startsWith(ROOM_STATE_CHAT_PREFIX)) {
        const raw = message.message.slice(ROOM_STATE_CHAT_PREFIX.length)
        const nextState = parseIncomingRoomState(raw)
        if (nextState) {
          applyRoomState(nextState)
        }
        return
      }

      if (message.message.startsWith(CHAT_HISTORY_REQUEST_PREFIX)) {
        const payload = message.message.slice(CHAT_HISTORY_REQUEST_PREFIX.length)
        let requesterRoomID = ''
        try {
          const parsed = JSON.parse(payload) as { roomId?: string }
          requesterRoomID = String(parsed?.roomId ?? '')
        } catch {
          return
        }
        if (!requesterRoomID || requesterRoomID !== roomId) {
          return
        }
        if (messagesRef.current.length === 0) {
          return
        }

        const snapshot: ChatHistorySnapshot = {
          version: 1,
          roomId,
          messages: trimChatHistory(messagesRef.current)
        }
        void room.localParticipant.sendChatMessage(
          `${CHAT_HISTORY_SNAPSHOT_PREFIX}${JSON.stringify(snapshot)}`
        )
        return
      }

      if (message.message.startsWith(CHAT_HISTORY_SNAPSHOT_PREFIX)) {
        const payload = message.message.slice(CHAT_HISTORY_SNAPSHOT_PREFIX.length)
        try {
          const snapshot = JSON.parse(payload) as ChatHistorySnapshot
          if (snapshot.version !== 1 || snapshot.roomId !== roomId || !Array.isArray(snapshot.messages)) {
            return
          }
          setMessages((prev) => mergeChatHistory(prev, snapshot.messages))
        } catch {
          // ignore malformed snapshots
        }
        return
      }

      const author = participant?.name || participant?.identity || displayName
      setMessages((prev) => trimChatHistory([...prev, toUiMessage(message, author)]))
    }

    room.on(RoomEvent.ChatMessage, onChatMessage)
    return () => {
      room.off(RoomEvent.ChatMessage, onChatMessage)
    }
  }, [applyRoomState, displayName, parseIncomingRoomState, room])

  useEffect(() => {
    if (!room || !roomId) {
      return
    }
    const requestPayload = JSON.stringify({ roomId })
    void room.localParticipant.sendChatMessage(`${CHAT_HISTORY_REQUEST_PREFIX}${requestPayload}`)
  }, [room, roomId])

  useEffect(() => {
    if (playbackHeartbeatTimerRef.current) {
      window.clearInterval(playbackHeartbeatTimerRef.current)
      playbackHeartbeatTimerRef.current = null
    }

    if (!room || !accessToken || roomMode !== 'movie' || !isPlaying || !selectedMovie) {
      return
    }

    playbackHeartbeatTimerRef.current = window.setInterval(() => {
      void syncPlaybackState('playing')
    }, PLAYBACK_HEARTBEAT_MS)

    return () => {
      if (playbackHeartbeatTimerRef.current) {
        window.clearInterval(playbackHeartbeatTimerRef.current)
        playbackHeartbeatTimerRef.current = null
      }
    }
  }, [accessToken, isPlaying, room, roomMode, selectedMovie, syncPlaybackState])

  useEffect(() => {
    if (!room) {
      return
    }

    const decoder = new TextDecoder()
    const onDataReceived = (
      payload: Uint8Array,
      _participant?: unknown,
      _kind?: unknown,
      topic?: string
    ) => {
      const raw = decoder.decode(payload)
      if (topic === PLAYBACK_STATE_TOPIC) {
        const nextPlaybackState = parseIncomingPlaybackState(raw)
        if (nextPlaybackState) {
          applyPlaybackState(nextPlaybackState)
        }
        return
      }
      if (topic && topic !== ROOM_STATE_TOPIC) {
        const nextPlaybackState = parseIncomingPlaybackState(raw)
        if (nextPlaybackState) {
          applyPlaybackState(nextPlaybackState)
        }
        return
      }

      const nextRoomState = parseIncomingRoomState(raw)
      if (nextRoomState) {
        applyRoomState(nextRoomState)
        return
      }

      const nextPlaybackState = parseIncomingPlaybackState(raw)
      if (nextPlaybackState) {
        applyPlaybackState(nextPlaybackState)
      }
    }

    room.on(RoomEvent.DataReceived, onDataReceived)
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived)
    }
  }, [applyPlaybackState, applyRoomState, parseIncomingPlaybackState, parseIncomingRoomState, room])

  const handleSelectMovie = async (movie: RoomMovie) => {
    if (!accessToken || !roomId) {
      return
    }
    try {
      const response = await roomApi.updateRoomState(roomId, accessToken, {
        mode: 'movie',
        media_id: movie.id
      })
      applyRoomState(response.state)
      await broadcastRoomState(response.state)
      setIsPlaying(false)
      const nextPlayback = await roomApi.updateRoomPlaybackState(roomId, accessToken, {
        mediaId: movie.id,
        status: 'paused',
        positionMs: 0,
        playbackRate: 1
      })
      playbackStateRef.current = nextPlayback
      await broadcastPlaybackState(nextPlayback)
      setShowModeSelect(false)
    } catch (error) {
      if (isAxiosError(error)) {
        const code = String(error.response?.data?.error ?? '')
        if (code === 'media_not_ready') {
          setMoviePlaybackError('Фильм еще обрабатывается. Дождитесь статуса Ready.')
          return
        }
      }
      setMoviePlaybackError('Не удалось переключить комнату в режим фильма')
    }
  }

  const switchToConference = async () => {
    if (!accessToken || !roomId) {
      return
    }
    try {
      const response = await roomApi.updateRoomState(roomId, accessToken, { mode: 'conference' })
      applyRoomState(response.state)
      await broadcastRoomState(response.state)
      setIsPlaying(false)
      playbackStateRef.current = null
      setShowModeSelect(false)
    } catch {
      setMoviePlaybackError('Не удалось переключить комнату в режим конференции')
    }
  }

  const handleTogglePlayback = () => {
    if (roomMode !== 'movie') {
      setIsPlaying((prev) => !prev)
      return
    }
    const video = movieVideoRef.current
    if (!video || !accessToken) {
      return
    }
    if (video.paused) {
      void video.play()
      return
    }
    video.pause()
  }

  const handleMoviePlay = useCallback(() => {
    setIsPlaying(true)
    if (!accessToken || isApplyingPlaybackRef.current) {
      return
    }
    void syncPlaybackState('playing')
  }, [accessToken, syncPlaybackState])

  const handleMoviePause = useCallback(() => {
    setIsPlaying(false)
    if (!accessToken || isApplyingPlaybackRef.current) {
      return
    }
    void syncPlaybackState('paused')
  }, [accessToken, syncPlaybackState])

  const handleMovieSeeked = useCallback(() => {
    const video = movieVideoRef.current
    if (!accessToken || !video || isApplyingPlaybackRef.current) {
      return
    }
    const nextStatus: RoomPlaybackState['status'] = video.paused || video.ended ? 'paused' : 'playing'
    void syncPlaybackState(nextStatus)
  }, [accessToken, syncPlaybackState])

  const handleMovieRateChange = useCallback(() => {
    if (!accessToken || isApplyingPlaybackRef.current) {
      return
    }
    void syncPlaybackState()
  }, [accessToken, syncPlaybackState])

  const handleMovieEnded = useCallback(() => {
    setIsPlaying(false)
    if (!accessToken || isApplyingPlaybackRef.current) {
      return
    }
    void syncPlaybackState('paused')
  }, [accessToken, syncPlaybackState])

  return (
    <CosmicBackdrop>
      <div className={styles.page}>
        <header className={styles.topbar}>
          <div className={styles.topRow}>
            <div className={styles.topLeft}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className={styles.iconButton}
                onClick={() => navigate(routePaths.dashboard)}
              >
                <ArrowLeft size={20} />
              </motion.button>

              <div className={styles.roomInfo}>
                <h1>{decodeURIComponent(roomId || 'Комната')}</h1>
                <p>
                  {roomMode === 'movie' && selectedMovie
                    ? `${selectedMovie.title} • ${participantCount} участников`
                    : `Конференция • ${participantCount} участников`}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.controls}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className={styles.iconButton}
              onClick={() => setShowModeSelect(true)}
            >
              {roomMode === 'movie' ? <Film size={18} /> : <Monitor size={18} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className={styles.iconButton}
              onClick={() => setShowSettings(true)}
            >
              <Settings size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleTogglePlayback}
              disabled={roomMode === 'movie' && !accessToken}
              className={`${styles.iconButton} ${isPlaying ? styles.active : ''}`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => void toggleMic()}
              disabled={isDeviceInitializing}
              className={`${styles.iconButton} ${isMicEnabled ? '' : styles.danger}`}
            >
              {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => void toggleCam()}
              disabled={isDeviceInitializing}
              className={`${styles.iconButton} ${isCamEnabled ? '' : styles.danger}`}
            >
              {isCamEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className={styles.iconButton}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </motion.button>
            {isMobile ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className={styles.iconButton}
              >
                <Menu size={18} />
              </motion.button>
            ) : null}
            </div>
          </div>
        </header>

        {joinError ? <p className={styles.error}>{joinError}</p> : null}
        {isJoining ? <p className={styles.hint}>Подключение к комнате...</p> : null}

        <main className={styles.content}>
          <section className={styles.videoStage}>
            {roomMode === 'movie' && selectedMovie ? (
              <div className={styles.movieStage}>
                {moviePlaybackSrc ? (
                  <video
                    ref={movieVideoRef}
                    className={styles.movieVideo}
                    controls
                    preload="metadata"
                    playsInline
                    poster={selectedMovie.thumbnail}
                    onPlay={handleMoviePlay}
                    onPause={handleMoviePause}
                    onSeeked={handleMovieSeeked}
                    onRateChange={handleMovieRateChange}
                    onEnded={handleMovieEnded}
                  />
                ) : (
                  <img
                    src={selectedMovie.thumbnail}
                    alt={selectedMovie.title}
                    className={styles.moviePoster}
                  />
                )}

                {!isPlaying ? (
                  <div className={styles.overlay}>Видео на паузе. Нажмите «Старт», чтобы продолжить.</div>
                ) : null}
                {moviePlaybackError ? <p className={styles.movieError}>{moviePlaybackError}</p> : null}
              </div>
            ) : (
              <div className={styles.grid}>
                <VideoTrackView label={`${displayName} (вы)`} track={localVideoTrack} muted />
                {remoteTracks.map((track) => (
                  <VideoTrackView key={track.id} label={track.label} track={track.track} />
                ))}
              </div>
            )}
          </section>

          <AnimatePresence>
            {(sidebarOpen || !isMobile) ? (
              <motion.aside
                initial={isMobile ? { x: '100%' } : false}
                animate={{ x: 0 }}
                exit={isMobile ? { x: '100%' } : {}}
                className={styles.sidebar}
              >
                {isMobile ? (
                  <div className={styles.sidebarHeader}>
                    <strong>Панель комнаты</strong>
                    <button type="button" className={styles.iconButton} onClick={() => setSidebarOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>
                ) : null}

                <div className={styles.tabs}>
                  {[
                    { id: 'chat' as const, label: 'Чат', icon: MessageCircle },
                    { id: 'participants' as const, label: 'Участники', icon: Users },
                    { id: 'video' as const, label: 'Видео', icon: VideoIcon }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={activeTab === tab.id ? styles.tabActive : styles.tab}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {activeTab === 'chat' ? (
                  <div className={styles.chat}>
                    <div className={styles.messages}>
                      {messages.length === 0 ? (
                        <p className={styles.emptyState}>Сообщений пока нет</p>
                      ) : (
                        messages.map((message) => (
                          <article key={message.id} className={styles.message}>
                            <p>{message.author}</p>
                            <span>{message.text}</span>
                            <small>{message.time}</small>
                          </article>
                        ))
                      )}
                    </div>
                    <div className={styles.chatForm}>
                      <textarea
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                            event.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Написать сообщение... (Ctrl+Enter для отправки)"
                        className={`glass-input ${styles.messageInput}`}
                        rows={3}
                      />
                      <button type="button" className={styles.sendButton} onClick={sendMessage}>
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'participants' ? (
                  <div className={styles.participants}>
                    {participants.map((participant) => (
                      <article key={participant.id} className={styles.participantRow}>
                        <strong>{participant.name}</strong>
                        <span>{participant.isLocal ? 'Host' : 'Online'}</span>
                      </article>
                    ))}
                  </div>
                ) : null}

                {activeTab === 'video' ? (
                  <div className={styles.videoTab}>
                    {localVideoTrack || remoteTracks.length ? (
                      <div className={styles.videoTabGrid}>
                        <VideoTrackView label={`${displayName} (вы)`} track={localVideoTrack} muted />
                        {remoteTracks.map((track) => (
                          <VideoTrackView key={track.id} label={track.label} track={track.track} />
                        ))}
                      </div>
                    ) : (
                      <p className={styles.emptyState}>Нет активных видеопотоков</p>
                    )}
                  </div>
                ) : null}
              </motion.aside>
            ) : null}
          </AnimatePresence>
        </main>

        {showGuestNamePrompt ? (
          <>
            <div className={styles.modalBackdrop} />
            <div className={styles.modalContainer}>
              <div className={`${styles.modalCard} ${styles.guestNameCard}`}>
                <h2>Как вас зовут?</h2>
                <p className={styles.modalMuted}>Введите имя, чтобы войти в комнату как гость</p>
                <div className={styles.guestNameForm}>
                  <input
                    type="text"
                    value={guestNameInput}
                    onChange={(event) => {
                      setGuestNameInput(event.target.value)
                      if (guestNameError) {
                        setGuestNameError('')
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        submitGuestName()
                      }
                    }}
                    placeholder="Ваше имя"
                    className="glass-input"
                    autoFocus
                  />
                  {guestNameError ? <p className={styles.modalError}>{guestNameError}</p> : null}
                  <button type="button" className="brand-button" onClick={submitGuestName}>
                    Войти в комнату
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <ModeSelectModal
          show={showModeSelect}
          currentMode={roomMode}
          movies={availableMovies}
          isLoadingMovies={isLoadingMovies}
          loadError={movieLoadError}
          onClose={() => setShowModeSelect(false)}
          onSelectConference={switchToConference}
          onSelectMovie={handleSelectMovie}
        />

        <SettingsModal
          show={showSettings}
          displayName={displayName}
          isGuest={!accessToken}
          micSensitivity={micSensitivity}
          masterVolume={masterVolume}
          onClose={() => setShowSettings(false)}
          onDisplayNameChange={setDisplayName}
          onMicSensitivityChange={setMicSensitivity}
          onMasterVolumeChange={setMasterVolume}
        />
      </div>
    </CosmicBackdrop>
  )
}

interface ModeSelectModalProps {
  show: boolean
  currentMode: RoomMode
  movies: RoomMovie[]
  isLoadingMovies: boolean
  loadError: string
  onClose: () => void
  onSelectConference: () => Promise<void> | void
  onSelectMovie: (movie: RoomMovie) => Promise<void> | void
}

const ModeSelectModal = ({
  show,
  currentMode,
  movies,
  isLoadingMovies,
  loadError,
  onClose,
  onSelectConference,
  onSelectMovie
}: ModeSelectModalProps) => {
  const [showMovieList, setShowMovieList] = useState(false)

  useEffect(() => {
    if (!show) {
      setShowMovieList(false)
    }
  }, [show])

  return (
    <AnimatePresence>
      {show ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            className={styles.modalContainer}
          >
            <div className={styles.modalCard}>
              <button type="button" className={styles.modalClose} onClick={onClose}>
                <X size={20} />
              </button>

              <h2>{showMovieList ? 'Выберите фильм' : 'Выберите режим'}</h2>

              {!showMovieList ? (
                <div className={styles.modeGrid}>
                  <button
                    type="button"
                    className={`${styles.modeCard} ${currentMode === 'conference' ? styles.modeActive : ''}`}
                    onClick={() => void onSelectConference()}
                  >
                    <Monitor size={34} />
                    <strong>Конференция</strong>
                    <small>Общение без просмотра фильма</small>
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeCard} ${currentMode === 'movie' ? styles.modeActive : ''}`}
                    onClick={() => setShowMovieList(true)}
                  >
                    <Film size={34} />
                    <strong>Просмотр фильма</strong>
                    <small>Совместный просмотр</small>
                  </button>
                </div>
              ) : (
                <div className={styles.movieListWrap}>
                  <button
                    type="button"
                    className={styles.modalBack}
                    onClick={() => setShowMovieList(false)}
                  >
                    <ChevronLeft size={16} />
                    Назад
                  </button>

                  {isLoadingMovies ? <p className={styles.modalMuted}>Загрузка фильмов...</p> : null}
                  {loadError ? <p className={styles.modalError}>{loadError}</p> : null}
                  {!isLoadingMovies && !loadError && movies.length === 0 ? (
                    <p className={styles.modalMuted}>Нет доступных фильмов</p>
                  ) : null}

                  <div className={styles.movieGrid}>
                    {movies.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        className={styles.movieCard}
                        onClick={() => void onSelectMovie(movie)}
                      >
                        <img src={movie.thumbnail} alt={movie.title} />
                        <span>{movie.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

interface SettingsModalProps {
  show: boolean
  displayName: string
  isGuest: boolean
  micSensitivity: number
  masterVolume: number
  onClose: () => void
  onDisplayNameChange: (value: string) => void
  onMicSensitivityChange: (value: number) => void
  onMasterVolumeChange: (value: number) => void
}

const SettingsModal = ({
  show,
  displayName,
  isGuest,
  micSensitivity,
  masterVolume,
  onClose,
  onDisplayNameChange,
  onMicSensitivityChange,
  onMasterVolumeChange
}: SettingsModalProps) => {
  const [nameInput, setNameInput] = useState(displayName)

  useEffect(() => {
    if (!show) {
      return
    }
    setNameInput(displayName)
  }, [displayName, show])

  const applyDisplayName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) {
      setNameInput(displayName)
      return
    }

    onDisplayNameChange(trimmed)
    if (!isGuest) {
      return
    }
    try {
      window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, trimmed)
    } catch {
      // ignore storage failures
    }
  }

  return (
    <AnimatePresence>
      {show ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalBackdrop}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            className={styles.modalContainer}
          >
            <div className={`${styles.modalCard} ${styles.settingsCard}`}>
              <button type="button" className={styles.modalClose} onClick={onClose}>
                <X size={20} />
              </button>

              <h2>Настройки</h2>

              <div className={styles.settingsBlock}>
                <div className={styles.settingsHead}>
                  <label>Имя в комнате</label>
                </div>
                <div className={styles.settingsNameRow}>
                  <input
                    type="text"
                    className="glass-input"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    onBlur={applyDisplayName}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        applyDisplayName()
                      }
                    }}
                    placeholder="Ваше имя"
                  />
                  <button type="button" className="brand-button" onClick={applyDisplayName}>
                    Сохранить
                  </button>
                </div>
              </div>

              <div className={styles.settingsBlock}>
                <div className={styles.settingsHead}>
                  <label>
                    <Mic size={15} />
                    Чувствительность микрофона
                  </label>
                  <span>{micSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={micSensitivity}
                  onChange={(event) => onMicSensitivityChange(Number(event.target.value))}
                />
              </div>

              <div className={styles.settingsBlock}>
                <div className={styles.settingsHead}>
                  <label>
                    <Volume2 size={15} />
                    Общая громкость
                  </label>
                  <span>{masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={masterVolume}
                  onChange={(event) => onMasterVolumeChange(Number(event.target.value))}
                />
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default WatchRoomPage
