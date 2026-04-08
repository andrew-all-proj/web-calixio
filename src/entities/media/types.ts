export interface MediaItem {
  id: string
  title: string
  originalName: string
  playbackUrl: string
  previewUrl?: string | null
  durationSec?: number | null
  fileSizeBytes: number
  mimeType: string
  status: string
  createdAt: string
}
