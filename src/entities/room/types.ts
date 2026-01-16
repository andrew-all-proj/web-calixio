export interface Room {
  id: string
  name: string
  createdAt: string
}

export interface CreateRoomResponse {
  id?: string
  roomId?: string
  room_id?: string
  room_name?: string
  name?: string
  status?: string
  created_at?: string
  token?: string
}

export type RoomPayload = Record<string, unknown>
