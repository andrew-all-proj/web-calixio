import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { VideoTrackItem } from '../model'
import { VideoTile } from './VideoTile'
import styles from './RoomsPage.module.css'

interface VideoGridProps {
  items: VideoGridItem[]
  className?: string
}

export interface VideoGridItem extends VideoTrackItem {
  muted?: boolean
  className?: string
  children?: ReactNode
  videoRef?: RefObject<HTMLVideoElement>
}

const getGrid = (count: number, width: number) => {
  if (!count || !width) {
    return { columns: 1, rows: 1 }
  }

  const ideal = Math.max(220, Math.min(360, width))
  const columns = Math.max(1, Math.min(count, Math.floor(width / ideal)))
  const rows = Math.ceil(count / columns)

  return { columns, rows }
}

export const VideoGrid = ({ items, className }: VideoGridProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const { columns } = useMemo(
    () => getGrid(items.length, width),
    [items.length, width]
  )

  return (
    <div
      ref={ref}
      className={`${styles.videoGrid}${className ? ` ${className}` : ''}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <VideoTile
          key={item.id}
          label={item.label}
          track={item.track}
          muted={item.muted}
          className={item.className}
          videoRef={item.videoRef}
        >
          {item.children}
        </VideoTile>
      ))}
    </div>
  )
}
