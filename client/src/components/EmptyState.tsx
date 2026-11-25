import type { ReactNode } from 'react'

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

export function BootScreen() {
  return (
    <div className="boot">
      <div className="brand-mark large" />
      <p>正在铺开纸页…</p>
    </div>
  )
}
