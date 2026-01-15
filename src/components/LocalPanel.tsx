import React from 'react'

type LocalPanelProps = {
  micEnabled: boolean
  cameraEnabled: boolean
  micGain: number
  outputVolume: number
  localMediaRef: React.RefObject<HTMLDivElement>
  onToggleMic: () => void
  onToggleCamera: () => void
  onMicGainChange: (value: number) => void
  onOutputVolumeChange: (value: number) => void
}

export default function LocalPanel({
  micEnabled,
  cameraEnabled,
  micGain,
  outputVolume,
  localMediaRef,
  onToggleMic,
  onToggleCamera,
  onMicGainChange,
  onOutputVolumeChange
}: LocalPanelProps) {
  return (
    <section className="card">
      <h2>Local</h2>
      <div className="actions">
        <button type="button" className={micEnabled ? 'ghost' : ''} onClick={onToggleMic}>
          {micEnabled ? 'Mute mic' : 'Unmute mic'}
        </button>
        <button type="button" className={cameraEnabled ? 'ghost' : ''} onClick={onToggleCamera}>
          {cameraEnabled ? 'Disable camera' : 'Enable camera'}
        </button>
      </div>
      <label>
        Microphone gain
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={micGain}
          onChange={(e) => onMicGainChange(Number(e.target.value))}
        />
      </label>
      <label>
        Output volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={outputVolume}
          onChange={(e) => onOutputVolumeChange(Number(e.target.value))}
        />
      </label>
      <div className="media-grid" ref={localMediaRef} />
    </section>
  )
}
