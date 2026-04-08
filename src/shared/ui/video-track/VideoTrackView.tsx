import { useEffect, useRef } from 'react'
import { Track } from 'livekit-client'
import styles from './VideoTrackView.module.css'

interface VideoTrackViewProps {
  label: string
  track: Track | null
  muted?: boolean
}

export const VideoTrackView = ({
  label,
  track,
  muted = false
}: VideoTrackViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!track || !videoRef.current) {
      return
    }

    track.attach(videoRef.current)

    return () => {
      if (videoRef.current) {
        track.detach(videoRef.current)
      }
    }
  }, [track])

  return (
    <article className={styles.tile}>
      <video ref={videoRef} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </article>
  )
}
