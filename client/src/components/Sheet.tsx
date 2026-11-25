import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="sheet-root" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        {title ? <h2 className="sheet-title">{title}</h2> : null}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmText = '确定',
  danger = false,
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  body: string
  confirmText?: string
  danger?: boolean
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <p className="dialog-text">{body}</p>
      <div className="sheet-actions">
        <button className="btn btn-ghost" type="button" onClick={onClose}>
          取消
        </button>
        <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} type="button" disabled={busy} onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Sheet>
  )
}
