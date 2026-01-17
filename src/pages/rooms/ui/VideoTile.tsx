import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Track } from 'livekit-client'
import styles from './RoomsPage.module.css'

interface VideoTileProps {
  label: string
  track: Track | null
  muted?: boolean
  className?: string
  children?: ReactNode
  videoRef?: RefObject<HTMLVideoElement>
}

export const VideoTile = ({
  label,
  track,
  muted = false,
  className,
  children,
  videoRef
}: VideoTileProps) => {
  const internalRef = useRef<HTMLVideoElement>(null)
  const ref = videoRef ?? internalRef

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
    <div className={`${styles.tile}${className ? ` ${className}` : ''}`}>
      {children}
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  )
}
