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

const GRID_GAP = 12
const TILE_RATIO = 16 / 9

const getGrid = (count: number, width: number, maxHeight: number) => {
  if (!count || !width) {
    return { columns: 1, rows: 1 }
  }

  const safeMaxHeight = Math.max(1, maxHeight)
  let best = { columns: 1, rows: count, score: 0 }

  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.ceil(count / columns)
    const totalGapX = GRID_GAP * Math.max(0, columns - 1)
    const totalGapY = GRID_GAP * Math.max(0, rows - 1)
    const tileWidth = Math.max(1, (width - totalGapX) / columns)
    const tileHeight = tileWidth / TILE_RATIO
    const gridHeight = tileHeight * rows + totalGapY
    const fits = gridHeight <= safeMaxHeight
    const area = tileWidth * tileHeight
    const score = (fits ? 1 : 0) * 1e12 + area

    if (score > best.score) {
      best = { columns, rows, score }
    }
  }

  return best
}

export const VideoGrid = ({ items, className }: VideoGridProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(entry.contentRect.width)
        setHeight(entry.contentRect.height)
      }
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const { columns } = useMemo(() => {
    const maxHeight = Math.max(height, viewportHeight * 0.6)
    return getGrid(items.length, width, maxHeight)
  }, [items.length, width, height, viewportHeight])

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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
