import { apiClient } from '@/shared/api'

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterPayload extends AuthCredentials {
  name: string
}

export interface AuthTokens {
  accessToken?: string
  token?: string
  access_token?: string
  name?: string
}

export const authApi = {
  login: async (payload: AuthCredentials) => {
    const response = await apiClient.post<AuthTokens>('/auth/login', payload)
    return response.data
  },
  register: async (payload: RegisterPayload) => {
    const response = await apiClient.post('/auth/register', payload)
    return response.data
  },
  refresh: async () => {
    const response = await apiClient.post<AuthTokens>('/auth/refresh')
    return response.data
  }
}
