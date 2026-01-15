import React, { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import { API_BASE } from './hooks/api'
import { getErrorMessage } from './hooks/api'
import useAuth from './hooks/useAuth'
import useLivekit from './hooks/useLivekit'
import useRooms from './hooks/useRooms'
import useTabShare from './hooks/useTabShare'

export default function App() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const location = useLocation()
  const initialParams = new URLSearchParams(location.search)
  const initialRoomId = initialParams.get('roomId') || ''
  const auth = useAuth({ setStatus, setError })
  const rooms = useRooms({
    setStatus,
    setError,
    apiFetchAuth: auth.apiFetchAuth,
    hasAuth: auth.isAuthed,
    initialRoomId
  })
  const { tab, onTabChange, shareLink } = useTabShare({
    roomId: rooms.roomId,
    setRoomId: rooms.setRoomId
  })
  const livekit = useLivekit({
    roomId: rooms.roomId,
    livekitToken: rooms.livekitToken,
    requestLivekitToken: rooms.requestLivekitToken,
    setStatus,
    setError
  })
  const allowGuestVideo = Boolean(rooms.roomId)

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'tab active' : 'tab')

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
          element={auth.isAuthed ? <Navigate to="/" replace /> : (
            <Login
              email={auth.loginEmail}
              password={auth.loginPassword}
              accessToken={auth.accessToken}
              refreshToken={auth.refreshToken}
              onEmailChange={auth.setLoginEmail}
              onPasswordChange={auth.setLoginPassword}
              onLogin={auth.onLogin}
              onClearTokens={auth.onLogout}
            />
          )}
        />
        <Route
          path="/register"
          element={auth.isAuthed ? <Navigate to="/" replace /> : (
            <Register
              name={auth.registerName}
              email={auth.registerEmail}
              password={auth.registerPassword}
              onNameChange={auth.setRegisterName}
              onEmailChange={auth.setRegisterEmail}
              onPasswordChange={auth.setRegisterPassword}
              onRegister={auth.onRegister}
            />
          )}
        />
        <Route
          path="/"
          element={auth.isAuthed || allowGuestVideo ? (
            <Dashboard
              tab={tab}
              isAuthed={auth.isAuthed}
              accessToken={auth.accessToken}
              refreshToken={auth.refreshToken}
              roomName={rooms.roomName}
              roomId={rooms.roomId}
              livekitToken={rooms.livekitToken}
              livekitWs={livekit.livekitWs}
              isConnected={livekit.isConnected}
              micEnabled={livekit.micEnabled}
              cameraEnabled={livekit.cameraEnabled}
              micGain={livekit.micGain}
              outputVolume={livekit.outputVolume}
              shareLink={shareLink}
              localMediaRef={livekit.localMediaRef}
              remoteMediaRef={livekit.remoteMediaRef}
              onTabChange={onTabChange}
              onLogout={auth.onLogout}
              onRoomNameChange={rooms.setRoomName}
              onRoomIdChange={rooms.setRoomId}
              onLivekitWsChange={livekit.setLivekitWs}
              onLivekitTokenChange={rooms.setLivekitToken}
              onCopyShareLink={() => {
                if (!shareLink || !navigator?.clipboard) {
                  return
                }
                navigator.clipboard.writeText(shareLink).then(
                  () => setStatus('Share link copied'),
                  (err) => setError(getErrorMessage(err, 'copy_failed'))
                )
              }}
              onToggleMic={livekit.onToggleMic}
              onToggleCamera={livekit.onToggleCamera}
              onMicGainChange={livekit.onMicGainChange}
              onOutputVolumeChange={livekit.onOutputVolumeChange}
              onCreateRoom={rooms.onCreateRoom}
              onEndRoom={rooms.onEndRoom}
              onConnect={livekit.onConnect}
              onDisconnect={livekit.onDisconnect}
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
