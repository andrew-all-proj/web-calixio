import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE ?? '/api'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async () => {
  try {
    const response = await apiClient.post<{ accessToken?: string; token?: string }>(
      '/auth/refresh'
    )
    return response.data.accessToken ?? response.data.token ?? null
  } catch {
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config

    if (
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (!refreshPromise) {
        isRefreshing = true
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false
        })
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
