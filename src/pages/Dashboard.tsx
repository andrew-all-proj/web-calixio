import React from 'react'
import LocalPanel from '../components/LocalPanel'

type TabKey = 'api' | 'video'

type DashboardProps = {
  tab: TabKey
  isAuthed: boolean
  accessToken: string
  refreshToken: string
  roomName: string
  roomId: string
  livekitToken: string
  livekitWs: string
  isConnected: boolean
  micEnabled: boolean
  cameraEnabled: boolean
  micGain: number
  outputVolume: number
  shareLink: string
  localMediaRef: React.RefObject<HTMLDivElement>
  remoteMediaRef: React.RefObject<HTMLDivElement>
  onTabChange: (tab: TabKey) => void
  onLogout: () => void
  onRoomNameChange: (value: string) => void
  onRoomIdChange: (value: string) => void
  onLivekitWsChange: (value: string) => void
  onLivekitTokenChange: (value: string) => void
  onCopyShareLink: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
  onMicGainChange: (value: number) => void
  onOutputVolumeChange: (value: number) => void
  onCreateRoom: (event: React.FormEvent<HTMLFormElement>) => void
  onEndRoom: (event: React.SyntheticEvent) => void
  onConnect: (event: React.FormEvent<HTMLFormElement>) => void
  onDisconnect: () => void
}

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
  micEnabled,
  cameraEnabled,
  micGain,
  outputVolume,
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
  onToggleMic,
  onToggleCamera,
  onMicGainChange,
  onOutputVolumeChange,
  onCreateRoom,
  onEndRoom,
  onConnect,
  onDisconnect
}: DashboardProps) {
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
            <button type="button" className="ghost" onClick={onLogout}>Logout</button>
          </section>

          <section className="card">
            <h2>Room management</h2>
            <form onSubmit={onCreateRoom} className="inline-actions">
              <label>
                Room name
                <input value={roomName} onChange={(e) => onRoomNameChange(e.target.value)} />
              </label>
              <div className="actions">
                <button type="submit">Create</button>
                <button type="button" className="danger" onClick={onEndRoom}>End room</button>
              </div>
            </form>
            <div className="mono">Room ID: {roomId || '—'}</div>
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

          <LocalPanel
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            micGain={micGain}
            outputVolume={outputVolume}
            localMediaRef={localMediaRef}
            onToggleMic={onToggleMic}
            onToggleCamera={onToggleCamera}
            onMicGainChange={onMicGainChange}
            onOutputVolumeChange={onOutputVolumeChange}
          />

          <section className="card">
            <h2>Remote</h2>
            <div className="media-grid" ref={remoteMediaRef} />
          </section>
        </main>
      )}
    </>
  )
}
