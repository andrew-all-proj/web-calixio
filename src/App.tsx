import React from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import useAppState from './hooks/useAppState'

export default function App() {
  const {
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
  } = useAppState()

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'tab active' : 'tab')

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Calixio LiveKit MVP</h1>
          <p>Quick local UI for auth, room management, and LiveKit token generation.</p>
        </div>
        <div className="pill">API: {import.meta.env.VITE_API_BASE || '/api'}</div>
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
              onLogin={onLogin}
              onClearTokens={onLogout}
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
              onRegister={onRegister}
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
              micEnabled={micEnabled}
              cameraEnabled={cameraEnabled}
              micGain={micGain}
              outputVolume={outputVolume}
              shareLink={shareLink}
              localMediaRef={localMediaRef}
              remoteMediaRef={remoteMediaRef}
              onTabChange={onTabChange}
              onLogout={onLogout}
              onRoomNameChange={setRoomName}
              onRoomIdChange={setRoomId}
              onLivekitWsChange={setLivekitWs}
              onLivekitTokenChange={setLivekitToken}
              onCopyShareLink={onCopyShareLink}
              onToggleMic={onToggleMic}
              onToggleCamera={onToggleCamera}
              onMicGainChange={onMicGainChange}
              onOutputVolumeChange={onOutputVolumeChange}
              onCreateRoom={onCreateRoom}
              onEndRoom={onEndRoom}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
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
