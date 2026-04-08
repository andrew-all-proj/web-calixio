import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const MicIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6.5 11.5C6.5 14.5376 8.96243 17 12 17C15.0376 17 17.5 14.5376 17.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 17V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 21H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const CamIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="7" width="13" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 10.2L21 7.8V16.2L16 13.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)

export const PipIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="12.5" y="11" width="6.5" height="5" rx="1.2" fill="currentColor" />
  </svg>
)

export const SettingsIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M19.4 13.15L20.6 12L19.4 10.85L18.2 10.7C18.04 10.18 17.83 9.69 17.55 9.24L18.05 8.1L16.9 6.95L15.76 7.45C15.31 7.17 14.82 6.96 14.3 6.8L14.15 5.6H12.52L11.85 5.6L11.7 6.8C11.18 6.96 10.69 7.17 10.24 7.45L9.1 6.95L7.95 8.1L8.45 9.24C8.17 9.69 7.96 10.18 7.8 10.7L6.6 10.85L5.4 12L6.6 13.15L7.8 13.3C7.96 13.82 8.17 14.31 8.45 14.76L7.95 15.9L9.1 17.05L10.24 16.55C10.69 16.83 11.18 17.04 11.7 17.2L11.85 18.4H14.15L14.3 17.2C14.82 17.04 15.31 16.83 15.76 16.55L16.9 17.05L18.05 15.9L17.55 14.76C17.83 14.31 18.04 13.82 18.2 13.3L19.4 13.15Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
)
