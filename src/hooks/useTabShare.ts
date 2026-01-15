import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type TabKey = 'api' | 'video'

type UseTabShareParams = {
  roomId: string
  setRoomId: (value: string) => void
}

export default function useTabShare({ roomId, setRoomId }: UseTabShareParams) {
  const location = useLocation()
  const navigate = useNavigate()
  const initialParams = new URLSearchParams(location.search)
  const initialRoomId = initialParams.get('roomId') || ''
  const initialTab = (initialParams.get('tab') || (initialRoomId ? 'video' : 'api')) as TabKey
  const [tab, setTab] = useState<TabKey>(initialTab)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paramRoomId = params.get('roomId')
    const paramTab = params.get('tab')
    if (paramRoomId !== null) {
      setRoomId(paramRoomId)
    }
    if (paramTab === 'video' || paramRoomId) {
      setTab('video')
    } else if (paramTab === 'api') {
      setTab('api')
    }
  }, [location.search, setRoomId])

  function onTabChange(nextTab: TabKey) {
    setTab(nextTab)
    if (nextTab !== 'video') {
      return
    }
    const params = new URLSearchParams(location.search)
    params.set('tab', 'video')
    if (roomId) {
      params.set('roomId', roomId)
    } else {
      params.delete('roomId')
    }
    params.delete('livekitToken')
    const search = params.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
  }

  const shareLink = useMemo(() => {
    if (!roomId) {
      return ''
    }
    const params = new URLSearchParams()
    params.set('tab', 'video')
    params.set('roomId', roomId)
    const base = typeof window === 'undefined' ? location.pathname : `${window.location.origin}${location.pathname}`
    return `${base}?${params.toString()}`
  }, [location.pathname, roomId])

  return { tab, onTabChange, shareLink }
}
