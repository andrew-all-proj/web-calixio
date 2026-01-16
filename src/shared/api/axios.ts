import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE ?? '/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)
