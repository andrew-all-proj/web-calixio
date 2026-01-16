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
  refreshToken?: string
  token?: string
  access_token?: string
  refresh_token?: string
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
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<AuthTokens>('/auth/refresh', {
      refreshToken
    })
    return response.data
  }
}
