import React from 'react'

export default function Dashboard({
  tab,
  isAuthed,
  accessToken,
  refreshToken,
  roomName,
  roomId,
  livekitToken,
  livekitWs,
  isConnected,
  shareLink,
  localMediaRef,
  remoteMediaRef,
  onTabChange,
  onLogout,
  onRoomNameChange,
  onRoomIdChange,
  onLivekitWsChange,
  onLivekitTokenChange,
  onCopyShareLink,
  onCreateRoom,
  onEndRoom,
  onConnect,
  onDisconnect
}) {
  return (
    <>
      <div className="tabs">
        {isAuthed && (
          <button type="button" className={tab === 'api' ? 'tab active' : 'tab'} onClick={() => onTabChange('api')}>
            API
          </button>
        )}
        <button type="button" className={tab === 'video' ? 'tab active' : 'tab'} onClick={() => onTabChange('video')}>
          Video
        </button>
      </div>

      {tab === 'api' && isAuthed && (
        <main className="grid">
          <section className="card">
            <h2>Session</h2>
            <div className="mono">Access: {accessToken ? accessToken.slice(0, 24) + '...' : '—'}</div>
            <div className="mono">Refresh: {refreshToken ? refreshToken.slice(0, 24) + '...' : '—'}</div>
            <button type="button" className="ghost" onClick={onLogout}>Logout</button>
          </section>

          <section className="card">
            <h2>Create room</h2>
            <form onSubmit={onCreateRoom}>
              <label>
                Room name
                <input value={roomName} onChange={(e) => onRoomNameChange(e.target.value)} />
              </label>
              <button type="submit">Create</button>
            </form>
            <div className="mono">Room ID: {roomId || '—'}</div>
          </section>

          <section className="card">
            <h2>End room</h2>
            <form onSubmit={onEndRoom}>
              <label>
                Room ID
                <input value={roomId} onChange={(e) => onRoomIdChange(e.target.value)} />
              </label>
              <button type="submit" className="danger">End room</button>
            </form>
            <div className="hint">Use this when the host finishes the call.</div>
          </section>
        </main>
      )}

      {tab === 'video' && (
        <main className="video">
          <section className="card">
            <h2>LiveKit connection</h2>
            <form onSubmit={onConnect} className="video-form">
              <label>
                LiveKit WS URL
                <input value={livekitWs} onChange={(e) => onLivekitWsChange(e.target.value)} />
              </label>
              <label>
                Room ID
                <input value={roomId} onChange={(e) => onRoomIdChange(e.target.value)} />
              </label>
              <label>
                LiveKit token
                <input value={livekitToken} readOnly />
              </label>
            <div className="actions">
              <button type="submit" disabled={isConnected}>Connect</button>
              <button type="button" className="ghost" onClick={onDisconnect} disabled={!isConnected}>Disconnect</button>
            </div>
          </form>
          <div className="hint">LiveKit token is requested automatically when you connect.</div>
          <label>
            Share link
            <input value={shareLink || ''} readOnly />
            </label>
            <div className="actions">
              <button type="button" onClick={onCopyShareLink} disabled={!shareLink}>Copy link</button>
            </div>
          </section>

          <section className="card">
            <h2>Local</h2>
            <div className="media-grid" ref={localMediaRef} />
          </section>

          <section className="card">
            <h2>Remote</h2>
            <div className="media-grid" ref={remoteMediaRef} />
          </section>
        </main>
      )}
    </>
  )
}
