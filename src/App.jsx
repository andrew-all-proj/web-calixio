import React, { useMemo, useRef, useState, useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Room, RoomEvent, createLocalTracks } from 'livekit-client'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const LIVEKIT_WS = import.meta.env.VITE_LIVEKIT_WS || 'ws://localhost:7880'
const ACCESS_KEY = 'calixio_access_token'
const REFRESH_KEY = 'calixio_refresh_token'

function loadAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || ''
}

function loadRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || ''
}

function saveAccessToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_KEY)
  }
}

function saveRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'request_failed')
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

function ensureParticipantBlock(root, participant) {
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

function cleanupParticipantBlock(root, participant) {
  if (!root) return
  const pid = participant?.sid || participant?.identity || 'unknown'
  const block = root.querySelector(`[data-participant-sid="${pid}"]`)
  if (!block) return
  const media = block.querySelector('.participant-media')
  if (media && media.children.length === 0) {
    block.remove()
  }
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialParams = new URLSearchParams(location.search)
  const initialRoomId = initialParams.get('roomId') || ''
  const initialTab = initialParams.get('tab') || (initialRoomId ? 'video' : 'api')
  const [tab, setTab] = useState(initialTab)
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
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const roomRef = useRef(null)
  const localMediaRef = useRef(null)
  const remoteMediaRef = useRef(null)

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

  function updateTokens(access, refresh) {
    saveAccessToken(access)
    saveRefreshToken(refresh)
    setAccessToken(access || '')
    setRefreshToken(refresh || '')
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      const err = new Error('missing_refresh')
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

  async function apiFetchAuth(path, options = {}) {
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
      if (err.status !== 401 || !refreshToken) {
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

  async function handleLogin(e) {
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
      setError(err.message)
      setStatus('')
    }
  }

  async function handleRegister(e) {
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
      setError(err.message)
      setStatus('')
    }
  }

  async function handleCreateRoom(e) {
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
      setError(err.message)
      setStatus('')
    }
  }

  async function handleEndRoom(e) {
    e.preventDefault()
    setError('')
    setStatus('Ending room...')
    try {
      await apiFetchAuth(`/rooms/${roomId}/end`, { method: 'POST' })
      setStatus('Room ended')
    } catch (err) {
      setError(err.message)
      setStatus('')
    }
  }

  function handleLogout() {
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
      setError(err.message)
      setStatus('')
      return ''
    }
  }

  async function handleConnect(e) {
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
        await room.localParticipant.publishTrack(track)
        const element = track.attach()
        element.dataset.trackSid = track.sid
        if (localMediaRef.current) {
          localMediaRef.current.appendChild(element)
        }
      }
      setIsConnected(true)
      setStatus('Connected to LiveKit')
    } catch (err) {
      setError(err.message || 'livekit_connect_failed')
      setStatus('')
      room.disconnect()
      roomRef.current = null
    }
  }

  function handleDisconnect() {
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

  const isAuthed = Boolean(accessToken || refreshToken)
  const allowGuestVideo = Boolean(roomId)
  const navClass = ({ isActive }) => (isActive ? 'tab active' : 'tab')

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

  function handleTabChange(nextTab) {
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

  async function handleCopyShareLink() {
    if (!shareLink || !navigator?.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(shareLink)
      setStatus('Share link copied')
    } catch (err) {
      setError(err.message || 'copy_failed')
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Calixio LiveKit MVP</h1>
          <p>Quick local UI for auth, room management, and LiveKit token generation.</p>
        </div>
        <div className="pill">API: {API_BASE}</div>
      </header>

      <nav className="tabs">
        <NavLink to="/login" className={navClass}>Login</NavLink>
        <NavLink to="/register" className={navClass}>Register</NavLink>
        <NavLink to="/" className={navClass}>App</NavLink>
      </nav>

      <Routes>
        <Route
          path="/login"
          element={isAuthed ? <Navigate to="/" replace /> : (
            <Login
              email={loginEmail}
              password={loginPassword}
              accessToken={accessToken}
              refreshToken={refreshToken}
              onEmailChange={setLoginEmail}
              onPasswordChange={setLoginPassword}
              onLogin={handleLogin}
              onClearTokens={handleLogout}
            />
          )}
        />
        <Route
          path="/register"
          element={isAuthed ? <Navigate to="/" replace /> : (
            <Register
              name={registerName}
              email={registerEmail}
              password={registerPassword}
              onNameChange={setRegisterName}
              onEmailChange={setRegisterEmail}
              onPasswordChange={setRegisterPassword}
              onRegister={handleRegister}
            />
          )}
        />
        <Route
          path="/"
          element={isAuthed || allowGuestVideo ? (
            <Dashboard
              tab={tab}
              isAuthed={isAuthed}
              accessToken={accessToken}
              refreshToken={refreshToken}
              roomName={roomName}
              roomId={roomId}
              livekitToken={livekitToken}
              livekitWs={livekitWs}
              isConnected={isConnected}
              shareLink={shareLink}
              localMediaRef={localMediaRef}
              remoteMediaRef={remoteMediaRef}
              onTabChange={handleTabChange}
              onLogout={handleLogout}
              onRoomNameChange={setRoomName}
              onRoomIdChange={setRoomId}
              onLivekitWsChange={setLivekitWs}
              onLivekitTokenChange={setLivekitToken}
              onCopyShareLink={handleCopyShareLink}
              onCreateRoom={handleCreateRoom}
              onEndRoom={handleEndRoom}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ) : <Navigate to="/login" replace />}
        />
      </Routes>

      <footer className="footer">
        {status && <div className="status">{status}</div>}
        {error && <div className="error">Error: {error}</div>}
        <div className="note">
          To connect a real video client, use LiveKit Meet or SDK and pass the token above.
        </div>
      </footer>
    </div>
  )
}
