import { apiClient } from '@/shared/api'
import {
  CreateRoomPayload,
  CreateRoomResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  RoomListItem,
  Room,
  RoomPlaybackState,
  UpdateRoomStatePayload,
  UpdateRoomStateResponse,
  UpdateRoomPlaybackPayload
} from '../types'

const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
})

export const roomApi = {
  listMyRooms: async (token: string) => {
    const response = await apiClient.get<RoomListItem[]>('/rooms', withAuth(token))
    return response.data
  },
  createRoom: async (token: string, payload: CreateRoomPayload = {}) => {
    const response = await apiClient.post<CreateRoomResponse>(
      '/rooms',
      payload,
      withAuth(token)
    )
    return response.data
  },
  joinRoom: async (id: string, payload: JoinRoomPayload = {}) => {
    const response = await apiClient.post<JoinRoomResponse>(
      `/rooms/${id}/join`,
      payload
    )
    return response.data
  },
  updateRoomState: async (id: string, token: string, payload: UpdateRoomStatePayload) => {
    const response = await apiClient.post<UpdateRoomStateResponse>(
      `/rooms/${id}/state`,
      payload,
      withAuth(token)
    )
    return response.data
  },
  getRoomPlaybackState: async (id: string) => {
    const response = await apiClient.get<RoomPlaybackState>(`/rooms/${id}/playback`)
    return response.data
  },
  updateRoomPlaybackState: async (id: string, token: string, payload: UpdateRoomPlaybackPayload) => {
    const response = await apiClient.post<RoomPlaybackState>(
      `/rooms/${id}/playback`,
      payload,
      withAuth(token)
    )
    return response.data
  },
  endRoom: async (id: string, token: string) => {
    const response = await apiClient.post<Room>(`/rooms/${id}/end`, {}, withAuth(token))
    return response.data
  }
}
