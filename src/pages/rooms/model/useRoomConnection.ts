import { useCallback, useRef, useState } from 'react'
import { RemoteParticipant, Room, RoomEvent, Track } from 'livekit-client'

export interface VideoTrackItem {
  id: string
  label: string
  track: Track
}

interface UseRoomConnectionOptions {
  livekitUrl?: string
  getParticipantLabel: (participant: RemoteParticipant) => string
}

interface UseRoomConnectionResult {
  room: Room | null
  remoteTracks: VideoTrackItem[]
  connectWithToken: (token: string) => Promise<void>
  leaveRoom: () => void
  clearRemoteTracks: () => void
}

export const useRoomConnection = ({
  livekitUrl,
  getParticipantLabel
}: UseRoomConnectionOptions): UseRoomConnectionResult => {
  const [room, setRoom] = useState<Room | null>(null)
  const [remoteTracks, setRemoteTracks] = useState<VideoTrackItem[]>([])
  const audioElements = useRef<Map<string, HTMLMediaElement>>(new Map())

  const clearRemoteTracks = useCallback(() => {
    setRemoteTracks([])
  }, [])

  const connectWithToken = useCallback(
    async (token: string) => {
      if (!livekitUrl) {
        throw new Error('livekit_url_missing')
      }

      const nextRoom = new Room()

      const addRemoteTrack = (track: Track, participant: RemoteParticipant) => {
        if (track.kind !== Track.Kind.Video) {
          return
        }

        setRemoteTracks((prev) => {
          if (prev.some((item) => item.track === track)) {
            return prev
          }

          return [
            ...prev,
            {
              id: track.sid ?? `${participant.sid}-${track.kind}`,
              label: getParticipantLabel(participant),
              track
            }
          ]
        })
      }

      nextRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach()
          audioElements.current.set(track.sid ?? participant.sid, element)
          return
        }

        addRemoteTrack(track, participant)
      })

      nextRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const key = track.sid ?? participant.sid
          const element = audioElements.current.get(key)
          if (element) {
            track.detach(element)
            element.remove()
            audioElements.current.delete(key)
          }
          return
        }

        if (track.kind !== Track.Kind.Video) {
          return
        }
        setRemoteTracks((prev) => prev.filter((item) => item.track !== track))
      })

      nextRoom.on(RoomEvent.Disconnected, () => {
        audioElements.current.forEach((element, key) => {
          element.remove()
          audioElements.current.delete(key)
        })
        setRoom(null)
        setRemoteTracks([])
      })

      await nextRoom.connect(livekitUrl, token)
      setRoom(nextRoom)
    },
    [getParticipantLabel, livekitUrl]
  )

  const leaveRoom = useCallback(() => {
    room?.disconnect()
  }, [room])

  return {
    room,
    remoteTracks,
    connectWithToken,
    leaveRoom,
    clearRemoteTracks
  }
}
