import { useRef, useState } from 'react'
import {
  LocalAudioTrack,
  LocalVideoTrack,
  Room,
  RoomEvent,
  createLocalTracks
} from 'livekit-client'
import { getErrorMessage } from './api'

const LIVEKIT_WS = import.meta.env.VITE_LIVEKIT_WS || 'ws://localhost:7880'

type UseLivekitParams = {
  roomId: string
  livekitToken: string
  requestLivekitToken: () => Promise<string>
  setStatus: (value: string) => void
  setError: (value: string) => void
}

type ParticipantLike = { sid?: string; identity?: string } | null | undefined

function ensureParticipantBlock(root: HTMLElement | null, participant: ParticipantLike) {
  if (!root) return null
  const pid = participant?.sid || participant?.identity || 'unknown'
  let block = root.querySelector(`[data-participant-sid="${pid}"]`)
  if (!block) {
    block = document.createElement('div')
    block.className = 'participant-card'
    block.setAttribute('data-participant-sid', pid)

    const header = document.createElement('div')
    header.className = 'participant-header'
    header.textContent = participant?.identity || pid

    const media = document.createElement('div')
    media.className = 'participant-media'

    block.appendChild(header)
    block.appendChild(media)
    root.appendChild(block)
  }
  return block
}

function cleanupParticipantBlock(root: HTMLElement | null, participant: ParticipantLike) {
  if (!root) return
  const pid = participant?.sid || participant?.identity || 'unknown'
  const block = root.querySelector(`[data-participant-sid="${pid}"]`)
  if (!block) return
  const media = block.querySelector('.participant-media')
  if (media && media.children.length === 0) {
    block.remove()
  }
}

export default function useLivekit({
  roomId,
  livekitToken,
  requestLivekitToken,
  setStatus,
  setError
}: UseLivekitParams) {
  const [livekitWs, setLivekitWs] = useState(LIVEKIT_WS)
  const [isConnected, setIsConnected] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micGain, setMicGain] = useState(1)
  const [outputVolume, setOutputVolume] = useState(1)
  const roomRef = useRef<Room | null>(null)
  const localMediaRef = useRef<HTMLDivElement | null>(null)
  const remoteMediaRef = useRef<HTMLDivElement | null>(null)
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null)
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  function applyOutputVolume(volume: number) {
    if (!localMediaRef.current) {
      return
    }
    const media = localMediaRef.current.querySelectorAll('audio, video')
    media.forEach((element) => {
      ;(element as HTMLMediaElement).volume = volume
    })
  }

  async function applyMicGain(track: LocalAudioTrack) {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    const context = audioContextRef.current
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch (err) {
        setError(getErrorMessage(err, 'audio_context_failed'))
      }
    }
    const source = context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]))
    const gain = context.createGain()
    gain.gain.value = micGain
    const destination = context.createMediaStreamDestination()
    source.connect(gain).connect(destination)
    gainNodeRef.current = gain
    const processedTrack = destination.stream.getAudioTracks()[0]
    if (processedTrack) {
      await track.replaceTrack(processedTrack, true)
    }
  }

  async function onConnect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!roomId) {
      setError('Room ID is missing')
      return
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Media devices are not available in this environment')
      return
    }
    if (isConnected) {
      return
    }
    let tokenToUse = livekitToken
    if (!tokenToUse) {
      tokenToUse = await requestLivekitToken()
    }
    if (!tokenToUse) {
      return
    }
    setStatus('Connecting to LiveKit...')

    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (!remoteMediaRef.current) {
        return
      }
      const block = ensureParticipantBlock(remoteMediaRef.current, participant)
      const media = block?.querySelector('.participant-media')
      if (!media) {
        return
      }
      const element = track.attach()
      if (element instanceof HTMLElement) {
        element.dataset.trackSid = track.sid
      }
      media.appendChild(element)
    })

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      const elements = remoteMediaRef.current?.querySelectorAll(`[data-track-sid="${track.sid}"]`) || []
      elements.forEach((el) => el.remove())
      track.detach().forEach((el) => el.remove())
      cleanupParticipantBlock(remoteMediaRef.current, participant)
    })

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      const pid = participant?.sid || participant?.identity || 'unknown'
      const block = remoteMediaRef.current?.querySelector(`[data-participant-sid="${pid}"]`)
      if (block) {
        block.remove()
      }
    })

    try {
      await room.connect(livekitWs, tokenToUse)
      const localTracks = await createLocalTracks({
        audio: { echoCancellation: true },
        video: true
      })
      for (const track of localTracks) {
        if (track.kind === 'audio') {
          localAudioTrackRef.current = track as LocalAudioTrack
        }
        if (track.kind === 'video') {
          localVideoTrackRef.current = track as LocalVideoTrack
        }
        await room.localParticipant.publishTrack(track)
        if (track.kind === 'audio') {
          await applyMicGain(track as LocalAudioTrack)
          continue
        }
      const element = track.attach()
      if (element instanceof HTMLElement) {
        element.dataset.trackSid = track.sid
      }
      if (element instanceof HTMLMediaElement) {
        element.volume = outputVolume
      }
        if (localMediaRef.current) {
          localMediaRef.current.appendChild(element)
        }
      }
      setIsConnected(true)
      setStatus('Connected to LiveKit')
    } catch (err) {
      setError(getErrorMessage(err, 'livekit_connect_failed'))
      setStatus('')
      room.disconnect()
      roomRef.current = null
    }
  }

  function onDisconnect() {
    if (!roomRef.current) {
      return
    }
    roomRef.current.disconnect()
    roomRef.current = null
    setIsConnected(false)
    setStatus('Disconnected')
    if (localMediaRef.current) {
      localMediaRef.current.innerHTML = ''
    }
    if (remoteMediaRef.current) {
      remoteMediaRef.current.innerHTML = ''
    }
  }

  async function onToggleMic() {
    const next = !micEnabled
    setMicEnabled(next)
    if (!roomRef.current) {
      return
    }
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(next)
    } catch (err) {
      setError(getErrorMessage(err, 'mic_toggle_failed'))
    }
  }

  async function onToggleCamera() {
    const next = !cameraEnabled
    setCameraEnabled(next)
    if (!roomRef.current) {
      return
    }
    try {
      await roomRef.current.localParticipant.setCameraEnabled(next)
    } catch (err) {
      setError(getErrorMessage(err, 'camera_toggle_failed'))
    }
  }

  function onMicGainChange(value: number) {
    setMicGain(value)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value
    }
  }

  function onOutputVolumeChange(value: number) {
    setOutputVolume(value)
    applyOutputVolume(value)
  }

  return {
    livekitWs,
    isConnected,
    micEnabled,
    cameraEnabled,
    micGain,
    outputVolume,
    localMediaRef,
    remoteMediaRef,
    setLivekitWs,
    onConnect,
    onDisconnect,
    onToggleMic,
    onToggleCamera,
    onMicGainChange,
    onOutputVolumeChange
  }
}
