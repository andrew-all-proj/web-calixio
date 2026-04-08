import { apiClient } from '@/shared/api'
import { MediaItem } from '../types'

const apiBaseURL =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_BASE_URL ??
  '/api'

export const resolvePlaybackManifestURL = (manifestURL?: string | null) => {
  if (!manifestURL) {
    return ''
  }
  if (/^https?:\/\//i.test(manifestURL) || /^blob:/i.test(manifestURL)) {
    return manifestURL
  }

  const normalizedPath = manifestURL.startsWith('/') ? manifestURL : `/${manifestURL}`

  if (/^https?:\/\//i.test(apiBaseURL)) {
    const base = new URL(apiBaseURL)
    const prefix = base.pathname.replace(/\/+$/, '')
    return `${base.origin}${prefix}${normalizedPath}`
  }

  const prefix = apiBaseURL.startsWith('/')
    ? apiBaseURL.replace(/\/+$/, '')
    : `/${apiBaseURL.replace(/\/+$/, '')}`
  return `${prefix}${normalizedPath}`
}

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
})

interface InitUploadInput {
  fileName: string
  contentType: string
  sizeBytes: number
}

interface InitUploadOutput {
  mediaId: string
  uploadUrl: string
  storageKey: string
}

interface CompleteUploadInput {
  mediaId: string
}

export interface MediaPlaybackPayload {
  mediaId: string
  status: string
  manifest: string
  manifestUrl?: string | null
  previewUrl?: string | null
  expiresAt: string
}

export const mediaApi = {
  listMyMedia: async (token: string) => {
    const response = await apiClient.get<MediaItem[]>('/media', withAuth(token))
    return response.data
  },

  initUpload: async (token: string, payload: InitUploadInput) => {
    const response = await apiClient.post<InitUploadOutput>(
      '/media/upload/init',
      payload,
      withAuth(token)
    )
    return response.data
  },

  completeUpload: async (token: string, payload: CompleteUploadInput) => {
    const response = await apiClient.post<{ mediaId: string; status: string }>(
      '/media/upload/complete',
      payload,
      withAuth(token)
    )
    return response.data
  },

  getPlayback: async (token: string, mediaId: string) => {
    const response = await apiClient.get<MediaPlaybackPayload>(
      `/media/${mediaId}/playback`,
      withAuth(token)
    )
    return response.data
  },

  deleteMedia: async (token: string, mediaId: string) => {
    const response = await apiClient.delete<{ mediaId: string; status: string }>(
      `/media/${mediaId}`,
      withAuth(token)
    )
    return response.data
  },

  uploadToPresignedUrl: (
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void
  ) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', contentType)

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return
        }
        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
        onProgress?.(percent)
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100)
          resolve()
          return
        }
        reject(new Error(`upload failed with status ${xhr.status}`))
      }

      xhr.onerror = () => {
        reject(new Error('network error during upload'))
      }

      xhr.send(file)
    })
}
