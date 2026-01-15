import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiFetch, getErrorMessage } from './api'

const ACCESS_KEY = 'calixio_access_token'
const REFRESH_KEY = 'calixio_refresh_token'

function loadAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || ''
}

function loadRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || ''
}

function saveAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(ACCESS_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_KEY)
  }
}

function saveRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_KEY)
  }
}

type UseAuthParams = {
  setStatus: (value: string) => void
  setError: (value: string) => void
}

export default function useAuth({ setStatus, setError }: UseAuthParams) {
  const navigate = useNavigate()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [accessToken, setAccessToken] = useState(loadAccessToken())
  const [refreshToken, setRefreshToken] = useState(loadRefreshToken())

  function updateTokens(access: string, refresh: string) {
    saveAccessToken(access)
    saveRefreshToken(refresh)
    setAccessToken(access || '')
    setRefreshToken(refresh || '')
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      const err = new Error('missing_refresh') as ApiError
      err.status = 401
      throw err
    }
    const data = await apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    updateTokens(data.access_token, data.refresh_token)
    return data.access_token
  }

  async function apiFetchAuth(path: string, options: RequestInit = {}) {
    let tokenToUse = accessToken
    if (!tokenToUse && refreshToken) {
      tokenToUse = await refreshAccessToken()
    }
    try {
      return await apiFetch(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenToUse}`
        }
      })
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status !== 401 || !refreshToken) {
        throw err
      }
      try {
        tokenToUse = await refreshAccessToken()
      } catch (refreshErr) {
        updateTokens('', '')
        throw refreshErr
      }
      return apiFetch(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${tokenToUse}`
        }
      })
    }
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('Logging in...')
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      updateTokens(data.access_token, data.refresh_token)
      setStatus('Logged in')
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    }
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('Registering...')
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword })
      })
      setStatus('Registered. Please log in to get tokens.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('')
    }
  }

  function onLogout() {
    updateTokens('', '')
    setStatus('Logged out')
  }

  const isAuthed = Boolean(accessToken || refreshToken)

  return {
    loginEmail,
    loginPassword,
    registerName,
    registerEmail,
    registerPassword,
    accessToken,
    refreshToken,
    isAuthed,
    setLoginEmail,
    setLoginPassword,
    setRegisterName,
    setRegisterEmail,
    setRegisterPassword,
    onLogin,
    onRegister,
    onLogout,
    apiFetchAuth
  }
}
