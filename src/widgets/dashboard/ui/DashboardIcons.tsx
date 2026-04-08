import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export const BrandVideoIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="6.5" width="13" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 10L21 7.8V16.2L16 14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)

export const HomeIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M4 10.5L12 4L20 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 10V19H17.5V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CameraIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="7" width="13" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 10L21 8V16L16 14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)

export const FilmGridIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 9H20M4 15H20M9 4V20M15 4V20" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

export const GearIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M19.2 13.1L20.5 12L19.2 10.9L18.2 10.7C18.05 10.25 17.86 9.82 17.61 9.44L18.03 8.49L16.9 7.36L15.95 7.78C15.57 7.53 15.14 7.34 14.69 7.19L14.5 6.2H12.9L12 6.2L11.8 7.19C11.36 7.34 10.93 7.53 10.55 7.78L9.6 7.36L8.47 8.49L8.89 9.44C8.64 9.82 8.45 10.25 8.3 10.7L7.3 10.9L6 12L7.3 13.1L8.3 13.3C8.45 13.75 8.64 14.18 8.89 14.56L8.47 15.51L9.6 16.64L10.55 16.22C10.93 16.47 11.36 16.66 11.8 16.81L12 17.8H14.5L14.69 16.81C15.14 16.66 15.57 16.47 15.95 16.22L16.9 16.64L18.03 15.51L17.61 14.56C17.86 14.18 18.05 13.75 18.2 13.3L19.2 13.1Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
)
