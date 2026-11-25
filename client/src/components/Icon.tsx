import type { ReactNode } from 'react'

export type IconName =
  | 'home'
  | 'notes'
  | 'plus'
  | 'folder'
  | 'user'
  | 'search'
  | 'pin'
  | 'heart'
  | 'trash'
  | 'archive'
  | 'more'
  | 'back'
  | 'check'
  | 'tag'
  | 'bell'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'copy'
  | 'download'
  | 'upload'
  | 'logout'
  | 'restore'
  | 'close'
  | 'filter'
  | 'chevron'

const icons: Record<IconName, ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z" />,
  notes: (
    <>
      <path d="M7 3.8h7.2L19 8.4V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1z" />
      <path d="M14 3.8V8h4.6M9 12.2h6M9 15.8h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  folder: <path d="M3.8 8.2A1.8 1.8 0 0 1 5.6 6.4h3.8l1.8 2h7.2a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8z" />,
  user: (
    <>
      <circle cx="12" cy="9" r="3.1" />
      <path d="M5.6 19a6.4 6.4 0 0 1 12.8 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m16 16 3.5 3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M8 9.2h8" />
      <path d="m9.2 9.2-.8 5.2L12 17l3.6-2.6-.8-5.2" />
      <path d="M12 3.6v5.6M12 17v3.2" />
    </>
  ),
  heart: <path d="M12 19s-6.6-4.1-6.6-8.2A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.6 2.6C18.6 14.9 12 19 12 19z" />,
  trash: (
    <>
      <path d="M5 7.5h14" />
      <path d="M9.4 7.4V5.6h5.2v1.8" />
      <path d="m8 7.5.7 11.4h6.6L16 7.5" />
    </>
  ),
  archive: (
    <>
      <path d="M4 8h16v10.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M3.2 4.6h17.6V8H3.2zM10 12.4h4" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  back: <path d="M15 5 8 12l7 7" />,
  check: <path d="m5 12.2 4.2 4.1L19 7.4" />,
  tag: (
    <>
      <path d="m4.2 12.2 7-7.2h6.2v6.2l-7.2 7z" />
      <circle cx="15.2" cy="8.2" r=".8" fill="currentColor" />
    </>
  ),
  bell: (
    <>
      <path d="M6.2 16.2h11.6l-1.1-1.8V11a4.7 4.7 0 0 0-9.4 0v3.4z" />
      <path d="M10 16.4a2 2 0 0 0 4 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4" />
    </>
  ),
  moon: <path d="M15.4 4.6A7 7 0 1 0 19 15.2 5.5 5.5 0 0 1 15.4 4.6z" />,
  monitor: (
    <>
      <rect x="4" y="5" width="16" height="10.5" rx="1.4" />
      <path d="M9 19.2h6M12 15.5v3.7" />
    </>
  ),
  copy: (
    <>
      <rect x="8.2" y="8.2" width="9.2" height="10.2" rx="1.3" />
      <path d="M6.6 15.2H5.8A1.3 1.3 0 0 1 4.5 13.9V5.8A1.3 1.3 0 0 1 5.8 4.5h7.4a1.3 1.3 0 0 1 1.3 1.3v.8" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.5v10" />
      <path d="m8 11 4 4 4-4M5 19h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.5v-10" />
      <path d="m8 8.5 4-4 4 4M5 19h14" />
    </>
  ),
  logout: (
    <>
      <path d="M10 7V5.4h8.2v13.2H10V16" />
      <path d="M4.2 12h8.6M7.2 9.2 4.2 12l3 2.8" />
    </>
  ),
  restore: (
    <>
      <path d="M5.2 12a6.8 6.8 0 1 0 1.8-4.6" />
      <path d="M5 4.6V8h3.4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  chevron: <path d="m9 6 6 6-6 6" />,
}

export function Icon({
  name,
  size = 22,
  filled = false,
}: {
  name: IconName
  size?: number
  filled?: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0.8 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}
