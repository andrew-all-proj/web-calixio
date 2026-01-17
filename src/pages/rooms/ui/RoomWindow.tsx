import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LocalVideoTrack } from 'livekit-client'
import { VideoTrackItem } from '../model'
import { VideoTile } from './VideoTile'
import styles from './RoomsPage.module.css'

interface RoomWindowProps {
  isConnected: boolean
  isJoining: boolean
  joinDisabled: boolean
  localVideoTrack: LocalVideoTrack | null
  remoteTracks: VideoTrackItem[]
  onJoin: () => void
  onLeave: () => void
  isMicEnabled: boolean
  isCamEnabled: boolean
  isDeviceInitializing: boolean
  micGain: number
  outputVolume: number
  displayName: string
  onDisplayNameChange: (value: string) => void
  onToggleMic: () => void
  onToggleCam: () => void
  onMicGainChange: (value: number) => void
  onOutputVolumeChange: (value: number) => void
}

export const RoomWindow = ({
  isConnected,
  isJoining,
  joinDisabled,
  localVideoTrack,
  remoteTracks,
  onJoin,
  onLeave,
  isMicEnabled,
  isCamEnabled,
  isDeviceInitializing,
  micGain,
  outputVolume,
  displayName,
  onDisplayNameChange,
  onToggleMic,
  onToggleCam,
  onMicGainChange,
  onOutputVolumeChange
}: RoomWindowProps) => {
  const { t } = useTranslation()
  const previewRef = useRef<HTMLVideoElement>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isMini, setIsMini] = useState(false)

  useEffect(() => {
    if (!localVideoTrack || !previewRef.current || isConnected) {
      return
    }

    localVideoTrack.attach(previewRef.current)

    return () => {
      if (previewRef.current) {
        localVideoTrack.detach(previewRef.current)
      }
    }
  }, [isConnected, localVideoTrack])

  return (
    <div className={styles.roomWindow}>
      {isConnected ? (
        <button type="button" className={styles.close} onClick={onLeave}>
          x
        </button>
      ) : null}
      {isConnected ? (
        <div className={styles.gridView}>
          <VideoTile
            label={displayName || t('rooms.you')}
            track={localVideoTrack}
            muted
            className={isMini ? styles.localMini : undefined}
          >
            {isMini ? (
              <button
                type="button"
                className={styles.miniRestore}
                onClick={() => setIsMini(false)}
              >
                {t('rooms.restore')}
              </button>
            ) : null}
          </VideoTile>
          {remoteTracks.map((item) => (
            <VideoTile key={item.id} label={item.label} track={item.track} />
          ))}
        </div>
      ) : (
        <div className={styles.preview}>
          <video ref={previewRef} autoPlay playsInline muted />
          <div className={styles.centerText}>
            <span>{t('rooms.nameLabel')}</span>
            <input
              type="text"
              className={styles.nameInput}
              value={displayName}
              onChange={(event) => onDisplayNameChange(event.target.value)}
              placeholder={t('rooms.guest')}
            />
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
            onClick={onToggleMic}
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
            onClick={onToggleCam}
            aria-pressed={!isCamEnabled}
            disabled={isDeviceInitializing}
          >
            {t('rooms.cam')}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsMini((prev) => !prev)}
          >
            {t('rooms.pip')}
          </button>
        </div>
        {!isConnected ? (
          <button
            type="button"
            className={styles.primary}
            onClick={onJoin}
            disabled={joinDisabled}
          >
            {isJoining ? t('rooms.join.loading') : t('rooms.connect')}
          </button>
        ) : null}
        <div className={styles.settingsWrap}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsSettingsOpen((prev) => !prev)}
          >
            {t('rooms.settings')}
          </button>
          {isSettingsOpen ? (
            <div className={styles.settingsPanel}>
              <label className={styles.slider}>
                <span>{t('rooms.settingsMic')}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micGain}
                  onChange={(event) =>
                    onMicGainChange(Number(event.target.value))
                  }
                />
              </label>
              <label className={styles.slider}>
                <span>{t('rooms.settingsVolume')}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={outputVolume}
                  onChange={(event) =>
                    onOutputVolumeChange(Number(event.target.value))
                  }
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
