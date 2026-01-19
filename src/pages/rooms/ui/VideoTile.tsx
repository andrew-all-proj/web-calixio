import { useEffect, useRef, useState } from 'react'
import type { PropsWithChildren, RefObject } from 'react'
import { Track } from 'livekit-client'
import styles from './RoomsPage.module.css'

type VideoTileProps = PropsWithChildren<{
  label: string
  track: Track | null
  muted?: boolean
  className?: string
  videoRef?: RefObject<HTMLVideoElement>
}>

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
  const [format, setFormat] = useState<'landscape' | 'portrait' | 'mixed'>(
    'mixed'
  )
  const [tileRatio, setTileRatio] = useState<number | null>(null)
  const MIN_TILE_RATIO = 0.7
  const MAX_TILE_RATIO = 2.0

  useEffect(() => {
    if (!track || !ref.current) {
      return
    }

    track.attach(ref.current)
    const video = ref.current

    const logMeta = () => {
      const { videoWidth, videoHeight } = video
      if (videoWidth && videoHeight) {
        const rawRatio = videoWidth / videoHeight
        const ratio = rawRatio.toFixed(3)
        if (rawRatio > 1.3) {
          setFormat('landscape')
        } else if (rawRatio < 0.8) {
          setFormat('portrait')
        } else {
          setFormat('mixed')
        }
        const clampedRatio = Math.min(
          MAX_TILE_RATIO,
          Math.max(MIN_TILE_RATIO, rawRatio)
        )
        setTileRatio(clampedRatio)
        console.info(
          `[VideoTile] ${label} ${videoWidth}x${videoHeight} ratio=${ratio}`
        )
      }
    }

    video.addEventListener('loadedmetadata', logMeta)
    video.addEventListener('resize', logMeta)
    logMeta()

    return () => {
      video.removeEventListener('loadedmetadata', logMeta)
      video.removeEventListener('resize', logMeta)
      if (ref.current) {
        track.detach(ref.current)
      }
    }
  }, [label, track])

  return (
    <div
      className={`${styles.tile} ${styles[`tile${format[0].toUpperCase()}${format.slice(1)}`]}${
        className ? ` ${className}` : ''
      }`}
      style={tileRatio ? { aspectRatio: `${tileRatio}` } : undefined}
    >
      {children}
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  )
}
