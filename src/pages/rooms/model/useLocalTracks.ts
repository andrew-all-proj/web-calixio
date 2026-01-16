import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createLocalTracks,
  LocalAudioTrack,
  LocalVideoTrack,
  Track
} from 'livekit-client'

type TrackWithMute = {
  mute: () => Promise<void> | void
  unmute: () => Promise<void> | void
  isMuted?: boolean
}

type TrackWithSetMuted = {
  setMuted: (muted: boolean) => Promise<void> | void
  isMuted?: boolean
}

type TrackWithSetEnabled = {
  setEnabled: (enabled: boolean) => Promise<void> | void
  isEnabled?: boolean
}

const getTrackEnabled = (track: LocalAudioTrack | LocalVideoTrack) => {
  const maybe = track as unknown as { isMuted?: boolean; isEnabled?: boolean }

  if (typeof maybe.isMuted === 'boolean') {
    return !maybe.isMuted
  }

  if (typeof maybe.isEnabled === 'boolean') {
    return maybe.isEnabled
  }

  return true
}

const setTrackEnabled = async (
  track: LocalAudioTrack | LocalVideoTrack,
  enabled: boolean
) => {
  const withMute = track as unknown as TrackWithMute
  if ('mute' in withMute && 'unmute' in withMute) {
    if (enabled) {
      await withMute.unmute()
    } else {
      await withMute.mute()
    }
    return
  }

  const withSetMuted = track as unknown as TrackWithSetMuted
  if ('setMuted' in withSetMuted) {
    await withSetMuted.setMuted(!enabled)
    return
  }

  const withSetEnabled = track as unknown as TrackWithSetEnabled
  if ('setEnabled' in withSetEnabled) {
    await withSetEnabled.setEnabled(enabled)
  }
}

interface UseLocalTracksResult {
  localAudioTrack: LocalAudioTrack | null
  localVideoTrack: LocalVideoTrack | null
  isMicEnabled: boolean
  isCamEnabled: boolean
  isDeviceInitializing: boolean
  micGain: number
  ensureLocalTracks: (options: { audio?: boolean; video?: boolean }) => Promise<void>
  toggleMic: () => Promise<void>
  toggleCam: () => Promise<void>
  setMicGain: (value: number) => void
}

export const useLocalTracks = (): UseLocalTracksResult => {
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(
    null
  )
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(
    null
  )
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCamEnabled, setIsCamEnabled] = useState(true)
  const [isDeviceInitializing, setIsDeviceInitializing] = useState(false)
  const [micGain, setMicGainState] = useState(80)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const destinationTrackRef = useRef<MediaStreamTrack | null>(null)

  const ensureLocalTracks = useCallback(
    async (options: { audio?: boolean; video?: boolean }) => {
      if (isDeviceInitializing) {
        return
      }

      const shouldCreateAudio = options.audio && !localAudioTrack
      const shouldCreateVideo = options.video && !localVideoTrack

      if (!shouldCreateAudio && !shouldCreateVideo) {
        return
      }

      setIsDeviceInitializing(true)

      try {
        const tracks = await createLocalTracks({
          audio: shouldCreateAudio,
          video: shouldCreateVideo
        })

        const audioTrack = tracks.find(
          (track) => track.kind === Track.Kind.Audio
        ) as LocalAudioTrack | undefined
        const videoTrack = tracks.find(
          (track) => track.kind === Track.Kind.Video
        ) as LocalVideoTrack | undefined

        if (audioTrack) {
          setLocalAudioTrack(audioTrack)
          setIsMicEnabled(getTrackEnabled(audioTrack))
        }

        if (videoTrack) {
          setLocalVideoTrack(videoTrack)
          setIsCamEnabled(getTrackEnabled(videoTrack))
        }
      } catch {
        // Ignore device errors; controls can retry on click.
      } finally {
        setIsDeviceInitializing(false)
      }
    },
    [isDeviceInitializing, localAudioTrack, localVideoTrack]
  )

  useEffect(() => {
    void ensureLocalTracks({ audio: true, video: true })
  }, [ensureLocalTracks])

  useEffect(() => {
    return () => {
      localAudioTrack?.stop()
      localVideoTrack?.stop()
      destinationTrackRef.current?.stop()
      audioContextRef.current?.close()
      audioContextRef.current = null
      gainNodeRef.current = null
    }
  }, [localAudioTrack, localVideoTrack])

  useEffect(() => {
    if (!gainNodeRef.current) {
      return
    }
    gainNodeRef.current.gain.value = micGain / 100
  }, [micGain])

  useEffect(() => {
    const setupGainPipeline = async () => {
      if (!localAudioTrack || gainNodeRef.current) {
        return
      }

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(
        new MediaStream([localAudioTrack.mediaStreamTrack])
      )
      const gainNode = audioContext.createGain()
      gainNode.gain.value = micGain / 100
      const destination = audioContext.createMediaStreamDestination()
      source.connect(gainNode).connect(destination)

      const processedTrack = destination.stream.getAudioTracks()[0]
      if (processedTrack) {
        await localAudioTrack.replaceTrack(processedTrack, true)
        destinationTrackRef.current = processedTrack
      }

      audioContextRef.current = audioContext
      gainNodeRef.current = gainNode
    }

    void setupGainPipeline()
  }, [localAudioTrack, micGain])

  const toggleMic = useCallback(async () => {
    if (!localAudioTrack) {
      await ensureLocalTracks({ audio: true })
      return
    }
    const next = !getTrackEnabled(localAudioTrack)
    await setTrackEnabled(localAudioTrack, next)
    setIsMicEnabled(next)
  }, [ensureLocalTracks, localAudioTrack])

  const toggleCam = useCallback(async () => {
    if (!localVideoTrack) {
      await ensureLocalTracks({ video: true })
      return
    }
    const next = !getTrackEnabled(localVideoTrack)
    await setTrackEnabled(localVideoTrack, next)
    setIsCamEnabled(next)
  }, [ensureLocalTracks, localVideoTrack])

  const setMicGain = useCallback((value: number) => {
    setMicGainState(value)
  }, [])

  return {
    localAudioTrack,
    localVideoTrack,
    isMicEnabled,
    isCamEnabled,
    isDeviceInitializing,
    micGain,
    ensureLocalTracks,
    toggleMic,
    toggleCam,
    setMicGain
  }
}
