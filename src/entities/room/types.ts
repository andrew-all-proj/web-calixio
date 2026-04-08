export interface Room {
  id: string
  name: string
  createdAt: string
}

export interface RoomListItem {
  id: string
  name: string
  status: string
  created_at: string
}

export interface CreateRoomResponse {
  id?: string
  roomId?: string
  room_id?: string
  room_name?: string
  user_name?: string
  name?: string
  status?: string
  created_at?: string
  token?: string
}

export interface CreateRoomPayload {
  name?: string
}

export interface JoinRoomPayload {
  user_name?: string
}

export type RoomPayload = CreateRoomPayload | JoinRoomPayload

export interface PlaybackState {
  mediaId: string
  status: string
  manifest: string
  manifestUrl?: string
  previewUrl?: string
  expiresAt: string
}

export interface RoomState {
  mode: 'conference' | 'movie'
  media_id?: string
  playback?: PlaybackState
}

export interface JoinRoomResponse {
  room_id: string
  room_name: string
  token: string
  expires_in: number
  state?: RoomState
}

export interface UpdateRoomStatePayload {
  mode: 'conference' | 'movie'
  media_id?: string
}

export interface UpdateRoomStateResponse {
  room_id: string
  room_name: string
  state: RoomState
}

export interface RoomPlaybackState {
  roomId: string
  mediaId: string
  status: 'playing' | 'paused' | 'seeking'
  positionMs: number
  playbackRate: number
  updatedAt: number
  version: number
  hostId: string
}

export interface UpdateRoomPlaybackPayload {
  mediaId: string
  status: 'playing' | 'paused' | 'seeking'
  positionMs: number
  playbackRate: number
}
