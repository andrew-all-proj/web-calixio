import axios, { AxiosHeaders } from 'axios'
import { useAuthStore } from '@/features/auth/model/useAuthStore'

export const resolveApiBaseURL = () => {
  const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredBaseURL) {
    return configuredBaseURL
  }

  const configuredBasePath = import.meta.env.VITE_API_BASE?.trim()
  if (configuredBasePath) {
    return configuredBasePath
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'calixio.managetlg.com') {
    return 'https://api.calixio.managetlg.com'
  }

  return '/api'
}

const baseURL = resolveApiBaseURL()

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async () => {
  try {
    const response = await apiClient.post<{ accessToken?: string; token?: string }>(
      '/auth/refresh'
    )
    const nextToken = response.data.accessToken ?? response.data.token ?? null
    if (nextToken) {
      useAuthStore.getState().setAccessToken(nextToken)
      apiClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`
    }
    return nextToken
  } catch {
    return null
  }
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    const headers = AxiosHeaders.from(config.headers ?? {})
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config

    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest?.url ?? '').includes('/auth/refresh')
    ) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken()
      }

      const accessToken = await refreshPromise
      refreshPromise = null

      if (accessToken) {
        originalRequest._retry = true
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`
        }
        return apiClient.request(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)
