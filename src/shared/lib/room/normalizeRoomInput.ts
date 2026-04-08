export const normalizeRoomInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const url = new URL(trimmed)
    const pathMatch = url.pathname.match(/\/room\/([^/?#]+)/)
    if (pathMatch?.[1]) {
      return pathMatch[1]
    }

    const param = url.searchParams.get('roomId') ?? url.searchParams.get('room')
    if (param) {
      return param
    }
  } catch {
    // Not a URL; use the raw input.
  }

  return trimmed
}
