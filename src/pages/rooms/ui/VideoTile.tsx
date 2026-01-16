import { useEffect, useRef } from 'react'
import { Track } from 'livekit-client'
import styles from './RoomsPage.module.css'

interface VideoTileProps {
  label: string
  track: Track | null
  muted?: boolean
}

export const VideoTile = ({ label, track, muted = false }: VideoTileProps) => {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!track || !ref.current) {
      return
    }

    track.attach(ref.current)

    return () => {
      if (ref.current) {
        track.detach(ref.current)
      }
    }
  }, [track])

  return (
    <div className={styles.tile}>
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  )
}
