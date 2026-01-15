import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LocalAudioTrack,
  LocalVideoTrack,
  Room,
  RoomEvent,
  createLocalTracks
} from 'livekit-client'
import { useLocation, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const LIVEKIT_WS = import.meta.env.VITE_LIVEKIT_WS || 'ws://localhost:7880'
const ACCESS_KEY = 'calixio_access_token'
const REFRESH_KEY = 'calixio_refresh_token'

type TabKey = 'api' | 'video'

type ApiError = Error & { status?: number; payload?: unknown }

type ParticipantLike = { sid?: string; identity?: string } | null | undefined

function getErrorMessage(err: unknown, fallback = 'request_failed') {
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

function loadAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || ''
}

function loadRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || ''
}

function saveAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(ACCESS_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_KEY)
  }
}

function saveRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, any>
  if (!res.ok) {
    const err = new Error(data.error || 'request_failed') as ApiError
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

function ensureParticipantBlock(root: HTMLElement | null, participant: ParticipantLike) {
  if (!root) return null
  const pid = participant?.sid || participant?.identity || 'unknown'
  let block = root.querySelector(`[data-participant-sid="${pid}"]`)
  if (!block) {
    block = document.createElement('div')
    block.className = 'participant-card'
    block.dataset.participantSid = pid

    const header = document.createElement('div')
    header.className = 'participant-header'
    header.textContent = participant?.identity || pid

    const media = document.createElement('div')
    media.className = 'participant-media'

    block.appendChild(header)
    block.appendChild(media)
    root.appendChild(block)
  }
  return block
}

function cleanupParticipantBlock(root: HTMLElement | null, participant: ParticipantLike) {
  if (!root) return
  const pid = participant?.sid || participant?.identity || 'unknown'
  const block = root.querySelector(`[data-participant-sid="${pid}"]`)
  if (!block) return
  const media = block.querySelector('.participant-media')
  if (media && media.children.length === 0) {
    block.remove()
  }
}

export type AppState = {
  tab: TabKey
  loginEmail: string
  loginPassword: string
  registerName: string
  registerEmail: string
  registerPassword: string
  roomName: string
  roomId: string
  accessToken: string
  refreshToken: string
  livekitToken: string
  livekitWs: string
  isConnected: boolean
  micEnabled: boolean
  cameraEnabled: boolean
  micGain: number
  outputVolume: number
  status: string
  error: string
  shareLink: string
  isAuthed: boolean
  allowGuestVideo: boolean
  localMediaRef: React.RefObject<HTMLDivElement>
  remoteMediaRef: React.RefObject<HTMLDivElement>
  onTabChange: (tab: TabKey) => void
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void
  onRegister: (event: React.FormEvent<HTMLFormElement>) => void
  onLogout: () => void
  onCreateRoom: (event: React.FormEvent<HTMLFormElement>) => void
  onEndRoom: (event: React.SyntheticEvent) => void
  onConnect: (event: React.FormEvent<HTMLFormElement>) => void
  onDisconnect: () => void
  onCopyShareLink: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
  onMicGainChange: (value: number) => void
  onOutputVolumeChange: (value: number) => void
  setLoginEmail: (value: string) => void
  setLoginPassword: (value: string) => void
  setRegisterName: (value: string) => void
  setRegisterEmail: (value: string) => void
  setRegisterPassword: (value: string) => void
  setRoomName: (value: string) => void
  setRoomId: (value: string) => void
  setLivekitWs: (value: string) => void
  setLivekitToken: (value: string) => void
}

export default function useAppState(): AppState {
  const navigate = useNavigate()
  const location = useLocation()
  const initialParams = new URLSearchParams(location.search)
  const initialRoomId = initialParams.get('roomId') || ''
  const initialTab = (initialParams.get('tab') || (initialRoomId ? 'video' : 'api')) as TabKey
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [roomName, setRoomName] = useState('demo')
  const [roomId, setRoomId] = useState(initialRoomId)
  const [accessToken, setAccessToken] = useState(loadAccessToken())
  const [refreshToken, setRefreshToken] = useState(loadRefreshToken())
  const [livekitToken, setLivekitToken] = useState('')
  const [livekitWs, setLivekitWs] = useState(LIVEKIT_WS)
  const [isConnected, setIsConnected] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micGain, setMicGain] = useState(1)
  const [outputVolume, setOutputVolume] = useState(1)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const roomRef = useRef<Room | null>(null)
  const localMediaRef = useRef<HTMLDivElement | null>(null)
  const remoteMediaRef = useRef<HTMLDivElement | null>(null)
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null)
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paramRoomId = params.get('roomId')
    const paramTab = params.get('tab')
    if (paramRoomId !== null) {
      setRoomId(paramRoomId)
    }
    if (paramTab === 'video' || paramRoomId) {
      setTab('video')
    } else if (paramTab === 'api') {
      setTab('api')
    }
  }, [location.search])

  function updateTokens(access: string, refresh: string) {
    saveAccessToken(access)
    saveRefreshToken(refresh)
    setAccessToken(access || '')
    setRefreshToken(refresh || '')
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      const err = new Error('missing_refresh') as ApiError
      err.status = 401
      throw err
    }
    const data = await apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    updateTokens(data.access_token, data.refresh_token)
    return data.access_token
  }

  async function apiFetchAuth(path: string, options: RequestInit = {}) {
    let tokenToUse = accessToken
    if (!tokenToUse && refreshToken) {
      tokenToUse = await refreshAccessToken()
    }
    try {
      return await apiFetch(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenToUse}`
        }
      })
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status !== 401 || !refreshToken) {
        throw err
      }
      try {
        tokenToUse = await refreshAccessToken()
      } catch (refreshErr) {
        updateTokens('', '')
        throw refreshErr
      }
      return apiFetch(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenToUse}`
        }
      })
    }
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('Logging in...')
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      updateTokens(data.access_token, data.refresh_token)
      setStatus('Logged in')
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    }
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('Registering...')
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword })
      })
      setStatus('Registered. Please log in to get tokens.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    }
  }

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

  function onLogout() {
    updateTokens('', '')
    setStatus('Logged out')
  }

  async function requestLivekitToken() {
    if (!roomId) {
      setError('Room ID is missing')
      return ''
    }
    setStatus('Requesting LiveKit token...')
    try {
      const data = accessToken || refreshToken
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

  async function onConnect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (isConnected) {
      return
    }
    let tokenToUse = livekitToken
    if (!tokenToUse) {
      tokenToUse = await requestLivekitToken()
    }
    if (!tokenToUse) {
      return
    }
    setStatus('Connecting to LiveKit...')

    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (!remoteMediaRef.current) {
        return
      }
      const block = ensureParticipantBlock(remoteMediaRef.current, participant)
      const media = block?.querySelector('.participant-media')
      if (!media) {
        return
      }
      const element = track.attach()
      element.dataset.trackSid = track.sid
      media.appendChild(element)
    })

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      const elements = remoteMediaRef.current?.querySelectorAll(`[data-track-sid="${track.sid}"]`) || []
      elements.forEach((el) => el.remove())
      track.detach().forEach((el) => el.remove())
      cleanupParticipantBlock(remoteMediaRef.current, participant)
    })

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      const pid = participant?.sid || participant?.identity || 'unknown'
      const block = remoteMediaRef.current?.querySelector(`[data-participant-sid="${pid}"]`)
      if (block) {
        block.remove()
      }
    })

    try {
      await room.connect(livekitWs, tokenToUse)
      const localTracks = await createLocalTracks({ audio: true, video: true })
      for (const track of localTracks) {
        if (track.kind === 'audio') {
          localAudioTrackRef.current = track as LocalAudioTrack
        }
        if (track.kind === 'video') {
          localVideoTrackRef.current = track as LocalVideoTrack
        }
        await room.localParticipant.publishTrack(track)
        if (track.kind === 'audio') {
          await applyMicGain(track as LocalAudioTrack)
        }
        const element = track.attach()
        element.dataset.trackSid = track.sid
        if (element instanceof HTMLMediaElement) {
          element.volume = outputVolume
        }
        if (localMediaRef.current) {
          localMediaRef.current.appendChild(element)
        }
      }
      setIsConnected(true)
      setStatus('Connected to LiveKit')
    } catch (err) {
      setError(getErrorMessage(err, 'livekit_connect_failed'))
      setStatus('')
      room.disconnect()
      roomRef.current = null
    }
  }

  function onDisconnect() {
    if (!roomRef.current) {
      return
    }
    roomRef.current.disconnect()
    roomRef.current = null
    setIsConnected(false)
    setStatus('Disconnected')
    if (localMediaRef.current) {
      localMediaRef.current.innerHTML = ''
    }
    if (remoteMediaRef.current) {
      remoteMediaRef.current.innerHTML = ''
    }
  }

  function applyOutputVolume(volume: number) {
    if (!localMediaRef.current) {
      return
    }
    const media = localMediaRef.current.querySelectorAll('audio, video')
    media.forEach((element) => {
      ;(element as HTMLMediaElement).volume = volume
    })
  }

  async function applyMicGain(track: LocalAudioTrack) {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    const context = audioContextRef.current
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch (err) {
        setError(getErrorMessage(err, 'audio_context_failed'))
      }
    }
    const source = context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]))
    const gain = context.createGain()
    gain.gain.value = micGain
    const destination = context.createMediaStreamDestination()
    source.connect(gain).connect(destination)
    gainNodeRef.current = gain
    const processedTrack = destination.stream.getAudioTracks()[0]
    if (processedTrack) {
      await track.replaceTrack(processedTrack, true)
    }
  }

  async function onToggleMic() {
    const next = !micEnabled
    setMicEnabled(next)
    if (!roomRef.current) {
      return
    }
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(next)
    } catch (err) {
      setError(getErrorMessage(err, 'mic_toggle_failed'))
    }
  }

  async function onToggleCamera() {
    const next = !cameraEnabled
    setCameraEnabled(next)
    if (!roomRef.current) {
      return
    }
    try {
      await roomRef.current.localParticipant.setCameraEnabled(next)
    } catch (err) {
      setError(getErrorMessage(err, 'camera_toggle_failed'))
    }
  }

  function onMicGainChange(value: number) {
    setMicGain(value)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value
    }
  }

  function onOutputVolumeChange(value: number) {
    setOutputVolume(value)
    applyOutputVolume(value)
  }

  const isAuthed = Boolean(accessToken || refreshToken)
  const allowGuestVideo = Boolean(roomId)

  const shareLink = useMemo(() => {
    if (!roomId) {
      return ''
    }
    const params = new URLSearchParams()
    params.set('tab', 'video')
    params.set('roomId', roomId)
    const base = typeof window === 'undefined' ? location.pathname : `${window.location.origin}${location.pathname}`
    return `${base}?${params.toString()}`
  }, [location.pathname, roomId])

  function onTabChange(nextTab: TabKey) {
    setTab(nextTab)
    if (nextTab !== 'video') {
      return
    }
    const params = new URLSearchParams(location.search)
    params.set('tab', 'video')
    if (roomId) {
      params.set('roomId', roomId)
    } else {
      params.delete('roomId')
    }
    params.delete('livekitToken')
    const search = params.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
  }

  async function onCopyShareLink() {
    if (!shareLink || !navigator?.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(shareLink)
      setStatus('Share link copied')
    } catch (err) {
      setError(getErrorMessage(err, 'copy_failed'))
    }
  }

  return {
    tab,
    loginEmail,
    loginPassword,
    registerName,
    registerEmail,
    registerPassword,
    roomName,
    roomId,
    accessToken,
    refreshToken,
    livekitToken,
    livekitWs,
    isConnected,
    micEnabled,
    cameraEnabled,
    micGain,
    outputVolume,
    status,
    error,
    shareLink,
    isAuthed,
    allowGuestVideo,
    localMediaRef,
    remoteMediaRef,
    onTabChange,
    onLogin,
    onRegister,
    onLogout,
    onCreateRoom,
    onEndRoom,
    onConnect,
    onDisconnect,
    onCopyShareLink,
    onToggleMic,
    onToggleCamera,
    onMicGainChange,
    onOutputVolumeChange,
    setLoginEmail,
    setLoginPassword,
    setRegisterName,
    setRegisterEmail,
    setRegisterPassword,
    setRoomName,
    setRoomId,
    setLivekitWs,
    setLivekitToken
  }
}
