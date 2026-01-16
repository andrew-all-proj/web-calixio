import { apiClient } from '@/shared/api'
import { CreateRoomResponse, Room, RoomPayload } from '../types'

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
})

export const roomApi = {
  createRoom: async (token: string, payload: RoomPayload = {}) => {
    const response = await apiClient.post<CreateRoomResponse>(
      '/rooms',
      payload,
      withAuth(token)
    )
    return response.data
  },
  joinRoom: async (id: string, payload: RoomPayload = {}) => {
    const response = await apiClient.post<CreateRoomResponse>(
      `/rooms/${id}/join`,
      payload
    )
    return response.data
  },
  endRoom: async (id: string, token: string) => {
    const response = await apiClient.post<Room>(`/rooms/${id}/end`, {}, withAuth(token))
    return response.data
  }
}
