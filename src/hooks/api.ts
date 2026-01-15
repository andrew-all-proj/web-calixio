export type ApiError = Error & { status?: number; payload?: unknown }

export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function getErrorMessage(err: unknown, fallback = 'request_failed') {
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, any>
  if (!res.ok) {
    const err = new Error(data.error || 'request_failed') as ApiError
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}
