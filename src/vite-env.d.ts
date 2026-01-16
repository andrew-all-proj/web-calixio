/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_LIVEKIT_WS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
